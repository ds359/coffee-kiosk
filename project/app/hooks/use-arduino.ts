import { useState, useCallback, useEffect, useRef } from 'react';

export interface ArduinoMessage {
  type: 'coin' | 'button' | 'error' | 'dosing' | 'result';
  data: string;
  timestamp: number;
}

export interface PortInfo {
  port: any;
  id: string;
  name: string;
}

export interface ArduinoHook {
  isConnected: boolean;
  isSupported: boolean;
  error: string | null;
  lastMessage: ArduinoMessage | null;
  availablePorts: PortInfo[];
  scanPorts: () => Promise<void>;
  connectToPort: (port: any) => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  send: (message: string) => Promise<void>;
}

export function useArduino(
  onMessage?: (message: ArduinoMessage) => void,
  baudRate: number = 9600
): ArduinoHook {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<ArduinoMessage | null>(null);
  const [availablePorts, setAvailablePorts] = useState<PortInfo[]>([]);
  
  const portRef = useRef<any>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);

  // Check if Web Serial API is supported
  const isSupported = typeof navigator !== 'undefined' && 'serial' in navigator;

  // Parse incoming data from Arduino
  const parseMessage = useCallback((raw: string): ArduinoMessage | null => {
    try {
      // Expected format: TYPE:DATA, D###, or F#
      // Examples:
      // COIN:5.00
      // BUTTON:espresso
      // D50 (dosing 50% complete)
      // F1 (success) or F0 (fail)
      
      const trimmed = raw.trim();
      
      // Handle dosing progress command: D###
      if (trimmed.startsWith('D')) {
        const progress = trimmed.substring(1);
        if (progress && !isNaN(Number(progress))) {
          const message: ArduinoMessage = {
            type: 'dosing',
            data: progress,
            timestamp: Date.now(),
          };
          return message;
        }
      }
      
      // Handle result command: F# (0=fail, 1=success)
      if (trimmed.startsWith('F')) {
        const result = trimmed.substring(1);
        if (result === '0' || result === '1') {
          const message: ArduinoMessage = {
            type: 'result',
            data: result === '1' ? 'success' : 'fail',
            timestamp: Date.now(),
          };
          return message;
        }
      }
      
      // Handle standard TYPE:DATA format
      const [type, data] = trimmed.split(':');
      
      if (!type || !data) return null;

      const message: ArduinoMessage = {
        type: type.toLowerCase() as ArduinoMessage['type'],
        data: data,
        timestamp: Date.now(),
      };

      return message;
    } catch (e) {
      console.error('Failed to parse Arduino message:', e);
      return null;
    }
  }, []);

  // Read data from Arduino
  const readLoop = useCallback(async () => {
    if (!portRef.current || !readerRef.current) return;

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await readerRef.current.read();
        if (done) break;

        // Decode and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines (messages end with newline)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            const message = parseMessage(line);
            if (message) {
              setLastMessage(message);
              onMessage?.(message);
            }
          }
        }
      }
    } catch (err) {
      console.error('Arduino read error:', err);
      setError(err instanceof Error ? err.message : 'Read error');
    }
  }, [parseMessage, onMessage]);

  // Disconnect from Arduino
  const disconnect = useCallback(async () => {
    try {
      // Cancel reader
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current.releaseLock();
        readerRef.current = null;
      }

      // Release writer
      if (writerRef.current) {
        writerRef.current.releaseLock();
        writerRef.current = null;
      }

      // Close port
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }

      setIsConnected(false);
      setError(null);
    } catch (err) {
      console.error('Failed to disconnect:', err);
      setError(err instanceof Error ? err.message : 'Disconnect failed');
    }
  }, []);

  // Scan for available serial ports
  const scanPorts = useCallback(async () => {
    if (!isSupported) {
      setError('Web Serial API not supported');
      return;
    }

    try {
      const ports = await (navigator as any).serial.getPorts();
      const portsInfo: PortInfo[] = ports.map((port: any, index: number) => {
        const info = port.getInfo();
        let name = `Serial Device ${index + 1}`;
        
        // Try to identify Arduino by USB vendor/product ID
        if (info.usbVendorId && info.usbProductId) {
          // Common Arduino vendor IDs:
          // 0x2341 = Arduino
          // 0x1A86 = CH340 chip (common on clones)
          // 0x0403 = FTDI
          if (info.usbVendorId === 0x2341) {
            name = `Arduino (VID: ${info.usbVendorId.toString(16)})`;
          } else if (info.usbVendorId === 0x1A86) {
            name = `Arduino Clone CH340 (VID: ${info.usbVendorId.toString(16)})`;
          } else if (info.usbVendorId === 0x0403) {
            name = `Arduino FTDI (VID: ${info.usbVendorId.toString(16)})`;
          } else {
            name = `USB Serial (VID: ${info.usbVendorId.toString(16)}, PID: ${info.usbProductId.toString(16)})`;
          }
        }
        
        return {
          port,
          id: `port-${index}`,
          name,
        };
      });
      
      setAvailablePorts(portsInfo);
      setError(null);
    } catch (err) {
      console.error('Failed to scan ports:', err);
      setError(err instanceof Error ? err.message : 'Failed to scan ports');
    }
  }, [isSupported]);

  // Connect to a specific port
  const connectToPort = useCallback(async (port: any) => {
    try {
      setError(null);

      // Close existing connection if any
      if (portRef.current && portRef.current !== port) {
        await disconnect();
      }

      // Open the port
      await port.open({ baudRate });

      portRef.current = port;
      
      // Setup reader and writer
      if (port.readable) {
        readerRef.current = port.readable.getReader();
        readLoop();
      }
      
      if (port.writable) {
        writerRef.current = port.writable.getWriter();
      }

      setIsConnected(true);
      
      // Refresh the ports list
      await scanPorts();
    } catch (err) {
      console.error('Failed to connect to port:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnected(false);
    }
  }, [baudRate, readLoop, disconnect, scanPorts]);

  // Connect to Arduino (show browser picker)
  const connect = useCallback(async () => {
    if (!isSupported) {
      setError('Web Serial API not supported in this browser');
      return;
    }

    try {
      setError(null);

      // Request a port
      const port = await (navigator as any).serial.requestPort();
      
      // Use connectToPort to handle the connection
      await connectToPort(port);
    } catch (err) {
      console.error('Failed to connect to Arduino:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnected(false);
    }
  }, [isSupported, connectToPort]);

  // Send data to Arduino
  const send = useCallback(async (message: string) => {
    if (!writerRef.current || !isConnected) {
      throw new Error('Arduino not connected');
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message + '\n'); // Add newline
      await writerRef.current.write(data);
    } catch (err) {
      console.error('Failed to send to Arduino:', err);
      throw err;
    }
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Auto-scan ports on mount
  useEffect(() => {
    if (isSupported) {
      scanPorts();
    }
  }, [isSupported, scanPorts]);

  return {
    isConnected,
    isSupported,
    error,
    lastMessage,
    availablePorts,
    scanPorts,
    connectToPort,
    connect,
    disconnect,
    send,
  };
}
