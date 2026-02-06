# Arduino Integration Examples

Complete examples showing how to integrate Arduino throughout your coffee kiosk app.

## 🎯 Complete Flow Example

### 1. Home Screen (Welcome + Coin Detection)

```tsx
// app/routes/home.tsx
import { useNavigate } from "react-router";
import { ArduinoController } from "~/components/arduino-controller";
import type { ArduinoMessage } from "~/hooks/use-arduino";

export default function Home() {
  const navigate = useNavigate();
  
  const handleArduinoMessage = (message: ArduinoMessage) => {
    // When coin is inserted, go to selection screen
    if (message.type === 'coin') {
      const amount = parseFloat(message.data);
      localStorage.setItem('insertedAmount', amount.toString());
      navigate("/selection");
    }
  };
  
  return (
    <>
      <ArduinoController onMessage={handleArduinoMessage} />
      <div onClick={() => navigate("/selection")}>
        <h1>Welcome - Insert Coin to Start</h1>
      </div>
    </>
  );
}
```

### 2. Selection Screen (Button Detection)

```tsx
// app/routes/selection.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArduinoController } from "~/components/arduino-controller";
import type { ArduinoMessage } from "~/hooks/use-arduino";

export default function Selection() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  
  useEffect(() => {
    const amount = localStorage.getItem('insertedAmount');
    setBalance(parseFloat(amount || '0'));
  }, []);
  
  const handleArduinoMessage = (message: ArduinoMessage) => {
    // Handle additional coins
    if (message.type === 'coin') {
      const amount = parseFloat(message.data);
      setBalance(prev => prev + amount);
    }
    
    // Handle physical button presses
    if (message.type === 'button') {
      const coffeeName = message.data; // e.g., "espresso", "latte"
      handleCoffeeSelection(coffeeName);
    }
  };
  
  const handleCoffeeSelection = (coffeeName: string) => {
    // Find coffee price and check balance
    const coffeePrice = getCoffeePrice(coffeeName);
    
    if (balance >= coffeePrice) {
      localStorage.setItem('selectedCoffee', coffeeName);
      navigate('/dosing');
    } else {
      alert('Insufficient funds! Please insert more coins.');
    }
  };
  
  return (
    <>
      <ArduinoController onMessage={handleArduinoMessage} />
      <div>
        <h2>Balance: ${balance.toFixed(2)}</h2>
        {/* Coffee selection UI */}
      </div>
    </>
  );
}
```

### 3. Dispensing Control

```tsx
// app/routes/dosing.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useArduino } from "~/hooks/use-arduino";

export default function Dosing() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('preparing');
  const { send, isConnected } = useArduino((message) => {
    // Monitor dispensing status
    if (message.type === 'status') {
      setStatus(message.data);
      
      if (message.data === 'complete') {
        setTimeout(() => navigate('/thank-you'), 1000);
      }
    }
  });
  
  useEffect(() => {
    // Send dispense command to Arduino when component mounts
    if (isConnected) {
      const startDispensing = async () => {
        try {
          await send('DISPENSE');
        } catch (err) {
          console.error('Failed to dispense:', err);
        }
      };
      startDispensing();
    }
  }, [isConnected, send]);
  
  return (
    <div>
      <h2>Making Your Coffee...</h2>
      <p>Status: {status}</p>
    </div>
  );
}
```

## 🔧 Advanced Arduino Code Examples

### Multi-Sensor Arduino Controller

```cpp
// Advanced Coffee Kiosk Controller with Multiple Sensors

#include <Servo.h>

// Pin definitions
const int COIN_SENSOR = A0;
const int TEMP_SENSOR = A1;
const int WATER_LEVEL = A2;
const int STATUS_LED = 13;
const int DISPENSE_SERVO = 9;
const int GRINDER_RELAY = 10;
const int PUMP_RELAY = 11;

// Button pins for coffee selection
const int BUTTON_PINS[] = {2, 3, 4, 5, 6, 7};
const String BUTTON_NAMES[] = {
  "espresso", "americano", "cappuccino", 
  "latte", "mocha", "macchiato"
};

Servo dispenseServo;
bool isDispensing = false;
unsigned long dispensingStartTime = 0;

void setup() {
  Serial.begin(9600);
  
  // Setup pins
  for (int i = 0; i < 6; i++) {
    pinMode(BUTTON_PINS[i], INPUT_PULLUP);
  }
  
  pinMode(STATUS_LED, OUTPUT);
  pinMode(GRINDER_RELAY, OUTPUT);
  pinMode(PUMP_RELAY, OUTPUT);
  
  dispenseServo.attach(DISPENSE_SERVO);
  dispenseServo.write(0);
  
  // Initialize
  digitalWrite(GRINDER_RELAY, LOW);
  digitalWrite(PUMP_RELAY, LOW);
  digitalWrite(STATUS_LED, HIGH);
  
  Serial.println("STATUS:ready");
}

void loop() {
  // Monitor sensors
  checkCoinSensor();
  checkButtons();
  checkWaterLevel();
  checkTemperature();
  
  // Handle dispensing process
  if (isDispensing) {
    handleDispensing();
  }
  
  // Handle incoming commands from web app
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    handleCommand(command);
  }
  
  delay(50);
}

void checkCoinSensor() {
  int coinValue = analogRead(COIN_SENSOR);
  if (coinValue > 100) {
    float amount = mapCoinValue(coinValue);
    Serial.print("COIN:");
    Serial.println(amount, 2);
    delay(500); // Debounce
  }
}

void checkButtons() {
  for (int i = 0; i < 6; i++) {
    if (digitalRead(BUTTON_PINS[i]) == LOW) {
      Serial.print("BUTTON:");
      Serial.println(BUTTON_NAMES[i]);
      delay(300); // Debounce
    }
  }
}

void checkWaterLevel() {
  int waterLevel = analogRead(WATER_LEVEL);
  if (waterLevel < 200) { // Low water
    Serial.println("ERROR:low_water");
    digitalWrite(STATUS_LED, LOW);
  }
}

void checkTemperature() {
  int tempReading = analogRead(TEMP_SENSOR);
  float temp = tempReading * 0.48828125; // Convert to Celsius
  
  if (temp < 85 || temp > 95) {
    Serial.print("STATUS:temp_");
    Serial.println(temp);
  }
}

void handleCommand(String cmd) {
  cmd.trim();
  
  if (cmd == "DISPENSE") {
    startDispensing();
  }
  else if (cmd == "RESET") {
    resetSystem();
  }
  else if (cmd == "STATUS") {
    reportStatus();
  }
  else if (cmd.startsWith("GRIND:")) {
    int duration = cmd.substring(6).toInt();
    grindCoffee(duration);
  }
}

void startDispensing() {
  if (isDispensing) return;
  
  Serial.println("STATUS:dispensing");
  isDispensing = true;
  dispensingStartTime = millis();
  
  // Activate grinder
  digitalWrite(GRINDER_RELAY, HIGH);
  delay(3000); // Grind for 3 seconds
  digitalWrite(GRINDER_RELAY, LOW);
  
  // Activate pump
  digitalWrite(PUMP_RELAY, HIGH);
  
  // Open dispense valve
  dispenseServo.write(90);
}

void handleDispensing() {
  unsigned long elapsed = millis() - dispensingStartTime;
  
  // Dispense for 30 seconds
  if (elapsed > 30000) {
    // Close valve
    dispenseServo.write(0);
    digitalWrite(PUMP_RELAY, LOW);
    
    isDispensing = false;
    Serial.println("STATUS:complete");
    digitalWrite(STATUS_LED, HIGH);
  }
}

void grindCoffee(int duration) {
  digitalWrite(GRINDER_RELAY, HIGH);
  delay(duration);
  digitalWrite(GRINDER_RELAY, LOW);
  Serial.println("STATUS:grind_complete");
}

void resetSystem() {
  isDispensing = false;
  digitalWrite(GRINDER_RELAY, LOW);
  digitalWrite(PUMP_RELAY, LOW);
  dispenseServo.write(0);
  digitalWrite(STATUS_LED, HIGH);
  Serial.println("STATUS:reset");
}

void reportStatus() {
  Serial.print("STATUS:water_");
  Serial.println(analogRead(WATER_LEVEL));
  
  int tempReading = analogRead(TEMP_SENSOR);
  Serial.print("STATUS:temp_");
  Serial.println(tempReading * 0.48828125);
}

float mapCoinValue(int sensorValue) {
  // Calibrate based on your coin acceptor
  if (sensorValue > 900) return 10.00;
  if (sensorValue > 700) return 5.00;
  if (sensorValue > 500) return 2.00;
  if (sensorValue > 300) return 1.00;
  if (sensorValue > 150) return 0.50;
  return 0.25;
}
```

## 🎨 UI Integration with Connection Status

### Show Arduino Connection Status

```tsx
// app/components/connection-status.tsx
import { useArduino } from '~/hooks/use-arduino';
import { Wifi, WifiOff } from 'lucide-react';
import styles from './connection-status.module.css';

export function ConnectionStatus() {
  const { isConnected, lastMessage } = useArduino();
  
  return (
    <div className={styles.status}>
      {isConnected ? (
        <>
          <Wifi size={16} />
          <span>Arduino Connected</span>
          {lastMessage && (
            <span className={styles.lastMessage}>
              Last: {lastMessage.type} - {lastMessage.data}
            </span>
          )}
        </>
      ) : (
        <>
          <WifiOff size={16} />
          <span>Arduino Disconnected</span>
        </>
      )}
    </div>
  );
}
```

### Auto-Reconnect Implementation

```tsx
// app/hooks/use-arduino-auto-connect.ts
import { useEffect } from 'react';
import { useArduino } from './use-arduino';

export function useArduinoAutoConnect(
  onMessage?: (message: ArduinoMessage) => void
) {
  const arduino = useArduino(onMessage);
  
  // Auto-reconnect if connection drops
  useEffect(() => {
    if (!arduino.isConnected && arduino.isSupported) {
      const timer = setInterval(() => {
        console.log('Attempting to reconnect Arduino...');
        arduino.connect().catch(err => {
          console.error('Reconnect failed:', err);
        });
      }, 5000);
      
      return () => clearInterval(timer);
    }
  }, [arduino.isConnected, arduino.isSupported]);
  
  return arduino;
}
```

## 🧪 Testing Without Physical Arduino

### Browser Console Simulator

```javascript
// Open browser console and run this to simulate Arduino messages

// Simulate coin insertion
function simulateCoin(amount) {
  window.postMessage({
    source: 'arduino-simulator',
    type: 'coin',
    data: amount.toFixed(2),
    timestamp: Date.now()
  }, '*');
}

// Simulate button press
function simulateButton(coffeeName) {
  window.postMessage({
    source: 'arduino-simulator',
    type: 'button',
    data: coffeeName,
    timestamp: Date.now()
  }, '*');
}

// Simulate status update
function simulateStatus(status) {
  window.postMessage({
    source: 'arduino-simulator',
    type: 'status',
    data: status,
    timestamp: Date.now()
  }, '*');
}

// Usage:
simulateCoin(5.00);  // Insert $5
simulateButton('espresso');  // Press espresso button
simulateStatus('dispensing');  // Update status
```

Then modify your Arduino hook to listen for simulated messages:

```tsx
// Add to use-arduino.ts
useEffect(() => {
  const handleSimulatedMessage = (event: MessageEvent) => {
    if (event.data.source === 'arduino-simulator') {
      const message: ArduinoMessage = {
        type: event.data.type,
        data: event.data.data,
        timestamp: event.data.timestamp
      };
      setLastMessage(message);
      onMessage?.(message);
    }
  };
  
  window.addEventListener('message', handleSimulatedMessage);
  return () => window.removeEventListener('message', handleSimulatedMessage);
}, [onMessage]);
```

## 📊 Monitoring Dashboard

Create an admin page to monitor Arduino activity:

```tsx
// app/routes/admin.tsx
import { useState } from 'react';
import { useArduino } from '~/hooks/use-arduino';

export default function AdminDashboard() {
  const [messageLog, setMessageLog] = useState<ArduinoMessage[]>([]);
  const { isConnected, send } = useArduino((message) => {
    setMessageLog(prev => [message, ...prev].slice(0, 100));
  });
  
  return (
    <div>
      <h1>Arduino Monitor</h1>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      
      <div>
        <h2>Send Commands</h2>
        <button onClick={() => send('STATUS')}>Get Status</button>
        <button onClick={() => send('RESET')}>Reset</button>
        <button onClick={() => send('DISPENSE')}>Test Dispense</button>
      </div>
      
      <div>
        <h2>Message Log</h2>
        {messageLog.map((msg, i) => (
          <div key={i}>
            [{new Date(msg.timestamp).toLocaleTimeString()}] 
            {msg.type}: {msg.data}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🚀 Production Tips

1. **Persistent Connection**: Store Arduino connection state in context
2. **Error Recovery**: Implement automatic reconnection
3. **Message Queue**: Queue commands if Arduino disconnects
4. **Logging**: Log all Arduino interactions for debugging
5. **Calibration**: Create calibration UI for coin sensor
6. **Health Checks**: Periodic status requests to verify connection
7. **Graceful Degradation**: Allow manual operation if Arduino fails

---

**Remember**: Always test thoroughly with your specific Arduino hardware and sensors. Calibration values will vary!
