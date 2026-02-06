import { useState } from "react";
import { useArduino, type ArduinoMessage } from "../hooks/use-arduino";
import { Usb, Zap } from "lucide-react";
import styles from "./arduino-controller.module.css";

interface ArduinoControllerProps {
  onMessage?: (message: ArduinoMessage) => void;
  baudRate?: number;
}

export function ArduinoController({ onMessage, baudRate = 9600 }: ArduinoControllerProps) {
  const [showDialog, setShowDialog] = useState(false);
  const { isConnected, isSupported, error, lastMessage, connect, disconnect } = useArduino(onMessage, baudRate);

  const handleConnect = async () => {
    setShowDialog(false);
    await connect();
  };

  if (!isSupported) {
    return null; // Don't show anything if not supported
  }

  return (
    <>
      <div className={styles.container}>
        <button
          className={`${styles.button} ${isConnected ? styles.connected : ""} ${error ? styles.error : ""}`}
          onClick={isConnected ? disconnect : () => setShowDialog(true)}
        >
          {isConnected ? (
            <>
              <Usb size={18} />
              <span>Connected</span>
              <span className={styles.status} />
            </>
          ) : (
            <>
              <Usb size={18} />
              <span>Connect </span>
            </>
          )}
        </button>
      </div>

      {showDialog && (
        <>
          <div className={styles.overlay} onClick={() => setShowDialog(false)} />
          <div className={styles.dialog}>
            <h2 className={styles.dialogTitle}>
              <Zap size={24} style={{ verticalAlign: "middle", marginRight: 8 }} />
              Connect Arduino
            </h2>
            <p className={styles.dialogDescription}>
              This will allow the kiosk to communicate with your Arduino via USB (UART).
            </p>

            <div className={styles.infoSection}>
              <h3 className={styles.infoTitle}>Expected Message Format</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--color-neutral-11)", marginBottom: "var(--space-3)" }}>
                Arduino should send messages in this format:
              </p>
              <div className={styles.codeBlock}>TYPE:DATA\n</div>
              <p style={{ fontSize: "0.875rem", color: "var(--color-neutral-11)", marginBottom: "var(--space-2)" }}>
                Examples:
              </p>
              <ul className={styles.infoList}>
                <li>
                  <code>COIN:5.00</code> - Coin inserted (5.00 value)
                </li>
                <li>
                  <code>BUTTON:espresso</code> - Button pressed
                </li>
                <li>
                  <code>STATUS:ready</code> - Status update
                </li>
              </ul>
            </div>

            <div className={styles.infoSection}>
              <h3 className={styles.infoTitle}>Arduino Requirements</h3>
              <ul className={styles.infoList}>
                <li>Baud rate: {baudRate}</li>
                <li>USB cable connected</li>
                <li>Serial port configured</li>
                <li>Messages must end with newline (\n)</li>
              </ul>
            </div>

            {error && (
              <div className={styles.errorMessage}>
                <strong>Error:</strong> {error}
              </div>
            )}

            {lastMessage && (
              <div className={styles.lastMessage}>
                <div className={styles.lastMessageLabel}>Last Message:</div>
                <div>Type: {lastMessage.type}</div>
                <div>Data: {lastMessage.data}</div>
              </div>
            )}

            <div className={styles.actions}>
              <button className={`${styles.actionButton} ${styles.cancelButton}`} onClick={() => setShowDialog(false)}>
                Cancel
              </button>
              <button className={`${styles.actionButton} ${styles.connectButton}`} onClick={handleConnect}>
                Connect Device
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
