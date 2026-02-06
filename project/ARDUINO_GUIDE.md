# Arduino Integration Guide

This guide explains how to connect your Arduino to the Coffee Kiosk web app via USB using the Web Serial API.

## 🔌 Overview

The kiosk uses the **Web Serial API** to communicate with Arduino over USB (UART protocol). This allows:
- Real-time coin detection
- Physical button inputs
- Status monitoring
- Two-way communication

## ✅ Browser Requirements

The Web Serial API works in:
- ✅ Chrome 89+ (recommended for kiosks)
- ✅ Edge 89+
- ✅ Opera 75+
- ❌ Firefox (not supported yet)
- ❌ Safari (not supported yet)

## 🔧 Arduino Setup

### 1. Hardware Connections

```
Arduino Pin Layout:
- Pin 2-9: Coffee selection buttons
- Pin A0: Coin sensor input
- Pin 13: Status LED
- USB: Connected to tablet
```

### 2. Arduino Code Example

```cpp
// Coffee Kiosk Arduino Controller
// Communicates with web app via Serial (USB)

const int COIN_SENSOR = A0;
const int STATUS_LED = 13;
const int BUTTON_PINS[] = {2, 3, 4, 5, 6, 7, 8, 9};
const String BUTTON_NAMES[] = {
  "espresso", "americano", "cappuccino", "latte",
  "mocha", "macchiato", "flat-white", "cortado"
};

void setup() {
  Serial.begin(9600);
  
  // Setup buttons with pullup resistors
  for (int i = 0; i < 8; i++) {
    pinMode(BUTTON_PINS[i], INPUT_PULLUP);
  }
  
  pinMode(STATUS_LED, OUTPUT);
  pinMode(COIN_SENSOR, INPUT);
  
  // Send ready signal
  Serial.println("STATUS:ready");
  digitalWrite(STATUS_LED, HIGH);
}

void loop() {
  // Check for coin insertion
  int coinValue = analogRead(COIN_SENSOR);
  if (coinValue > 100) { // Threshold for coin detection
    float amount = mapCoinValue(coinValue);
    Serial.print("COIN:");
    Serial.println(amount, 2);
    delay(500); // Debounce
  }
  
  // Check button presses
  for (int i = 0; i < 8; i++) {
    if (digitalRead(BUTTON_PINS[i]) == LOW) {
      Serial.print("BUTTON:");
      Serial.println(BUTTON_NAMES[i]);
      delay(300); // Debounce
    }
  }
  
  // Read commands from web app
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    handleCommand(command);
  }
  
  delay(50);
}

float mapCoinValue(int sensorValue) {
  // Map sensor reading to coin value
  // Customize based on your coin sensor
  if (sensorValue > 900) return 10.00;
  if (sensorValue > 700) return 5.00;
  if (sensorValue > 500) return 2.00;
  if (sensorValue > 300) return 1.00;
  return 0.50;
}

void handleCommand(String cmd) {
  // Handle dosing command: S### (e.g., S100 = 100ml)
  if (cmd.startsWith("S")) {
    int amount = cmd.substring(1).toInt(); // Extract number after 'S'
    
    if (amount > 0 && amount <= 500) { // Validate range (0-500ml)
      // Turn off LED during dosing
      digitalWrite(STATUS_LED, LOW);
      
      // Calculate dispensing time based on amount
      // Example: 1ml = 100ms (adjust based on your pump flow rate)
      int totalTime = amount * 100;
      int updateInterval = 100; // Send progress update every 100ms
      int elapsed = 0;
      bool success = true; // Track if dosing succeeds
      
      // Activate coffee pump/valve here
      // pinMode(PUMP_PIN, OUTPUT);
      // digitalWrite(PUMP_PIN, HIGH);
      
      // Dispense with progress updates
      while (elapsed < totalTime) {
        delay(updateInterval);
        elapsed += updateInterval;
        
        // Calculate and send progress percentage (0-100)
        int progress = (elapsed * 100) / totalTime;
        if (progress > 100) progress = 100;
        
        Serial.print("D");
        Serial.println(progress);
        
        // Check for errors during dosing (sensor checks, etc.)
        // if (errorDetected()) {
        //   success = false;
        //   break;
        // }
      }
      
      // Deactivate pump
      // digitalWrite(PUMP_PIN, LOW);
      
      // Send 100% completion
      Serial.println("D100");
      
      // Send result: F1 (success) or F0 (fail)
      if (success) {
        Serial.println("F1"); // Success
      } else {
        Serial.println("F0"); // Fail
      }
      
      digitalWrite(STATUS_LED, HIGH);
    } else {
      Serial.println("ERROR:invalid_amount");
      Serial.println("F0"); // Invalid amount = fail
    }
  }
}
```

### 3. Upload to Arduino

1. Open Arduino IDE
2. Copy the code above
3. Select your board (e.g., Arduino Uno)
4. Select the correct COM port
5. Click **Upload**
6. Open Serial Monitor (9600 baud) to test

## 🌐 Web App Integration

### Using the Arduino Controller Component

The app includes a ready-to-use `ArduinoController` component:

```tsx
import { ArduinoController } from '~/components/arduino-controller';
import type { ArduinoMessage } from '~/hooks/use-arduino';

export default function Home() {
  const handleArduinoMessage = (message: ArduinoMessage) => {
    console.log('Arduino:', message);
    
    if (message.type === 'coin') {
      // Add credit to user balance
      const amount = parseFloat(message.data);
      addCredit(amount);
    }
    
    if (message.type === 'button') {
      // Handle coffee selection
      selectCoffee(message.data);
    }
  };
  
  return (
    <div>
      <ArduinoController onMessage={handleArduinoMessage} />
      {/* Your kiosk UI */}
    </div>
  );
}
```

### Message Protocol

**From Arduino → Web App:**

| Message | Format | Description |
|---------|--------|-------------|
| Coin inserted | `COIN:5.00` | Amount detected |
| Button pressed | `BUTTON:espresso` | Coffee selection |
| Status update | `STATUS:ready` | Device status |
| Dosing progress | `D50` | Dosing 50% complete |
| Result success | `F1` | Dosing succeeded |
| Result fail | `F0` | Dosing failed |
| Error | `ERROR:sensor_fail` | Error notification |

**From Web App → Arduino:**

| Command | Format | Description |
|---------|--------|-------------|
| Dose coffee | `S100\n` | Dose 100ml of coffee |
| Dose coffee | `S50\n` | Dose 50ml of coffee |
| Dose coffee | `S300\n` | Dose 300ml of coffee |

**Command Details:**

**`S###` - Dosing Command (App → Arduino):**
- Format: `S` followed by amount in milliliters
- Examples: `S30` (small), `S50` (medium), `S70` (large)
- Arduino should activate pump and send progress updates

**`D###` - Progress Update (Arduino → App):**
- Format: `D` followed by percentage (0-100)
- Examples: `D0`, `D25`, `D50`, `D75`, `D100`
- Send this during dosing to update progress bar in real-time
- Recommend sending every 100-500ms
- App navigates to thank you screen when `D100` received

**`F#` - Result Status (Arduino → App):**
- Format: `F` followed by `1` (success) or `0` (fail)
- Send `F1` when dosing completes successfully
- Send `F0` if dosing fails (error, sensor issue, empty, etc.)
- App displays success/fail message on thank you screen
- Examples: `F1` (success), `F0` (fail)

### Custom Hook Usage

For more control, use the `useArduino` hook directly:

```tsx
import { useArduino } from '~/hooks/use-arduino';

function CoffeeKiosk() {
  const { 
    isConnected, 
    lastMessage, 
    connect, 
    disconnect, 
    send 
  } = useArduino((message) => {
    // Handle messages
    console.log(message);
  }, 9600); // Baud rate
  
  const dispenseCoffee = async (amount: number) => {
    // Send S### command where ### is the amount in ml
    await send(`S${amount}`);
  };
  
  return (
    <div>
      {isConnected ? (
        <button onClick={dispenseCoffee}>Dispense</button>
      ) : (
        <button onClick={connect}>Connect Arduino</button>
      )}
    </div>
  );
}
```

## 🔍 Troubleshooting

### Arduino Not Detected

1. **Check USB cable**: Ensure it's a data cable, not just power
2. **Check drivers**: Install CH340/FTDI drivers if needed
3. **Check permissions**: Browser needs permission to access serial ports
4. **Try different port**: Some tablets have multiple USB ports

### No Data Received

1. **Check baud rate**: Must match (default: 9600)
2. **Check Serial.begin()**: Must be in Arduino setup()
3. **Check wiring**: Ensure TX/RX or USB properly connected
4. **Open Serial Monitor**: Test Arduino is sending data

### Connection Drops

1. **Check power**: Arduino needs stable 5V
2. **Check cable**: Bad cables cause intermittent connections
3. **Add reconnect logic**: Implement auto-reconnect in app
4. **Check tablet power**: Low battery can affect USB

### Button Not Working

1. **Check pullup resistors**: Use `INPUT_PULLUP` mode
2. **Add debouncing**: 200-300ms delay after press
3. **Check wiring**: Buttons to GND when pressed
4. **Test in Serial Monitor**: Verify Arduino sends messages

## 🚀 Advanced Features

### Auto-Reconnect

```tsx
useEffect(() => {
  const interval = setInterval(() => {
    if (!isConnected && isSupported) {
      connect().catch(console.error);
    }
  }, 5000);
  
  return () => clearInterval(interval);
}, [isConnected, isSupported, connect]);
```

### Error Handling

```tsx
const handleMessage = (message: ArduinoMessage) => {
  if (message.type === 'error') {
    toast.error(`Arduino Error: ${message.data}`);
    // Implement recovery logic
  }
};
```

### Data Validation

```tsx
const handleMessage = (message: ArduinoMessage) => {
  if (message.type === 'coin') {
    const amount = parseFloat(message.data);
    if (isNaN(amount) || amount <= 0) {
      console.error('Invalid coin value');
      return;
    }
    addCredit(amount);
  }
};
```

## 📊 Testing Without Arduino

Use the browser console to simulate messages:

```javascript
// Simulate coin insertion
window.dispatchEvent(new CustomEvent('arduino-message', {
  detail: { type: 'coin', data: '5.00', timestamp: Date.now() }
}));

// Simulate button press
window.dispatchEvent(new CustomEvent('arduino-message', {
  detail: { type: 'button', data: 'espresso', timestamp: Date.now() }
}));
```

## 🔐 Security Considerations

- Web Serial API requires **HTTPS** in production (localhost is OK for development)
- User must explicitly grant permission to connect
- Consider implementing authentication for dispensing commands
- Validate all incoming data from Arduino
- Implement rate limiting for coin detection

## 📦 Required Permissions

The browser will ask for permission to:
1. Access USB devices
2. Read/write to serial port

Make sure to:
- Use HTTPS (required for Web Serial API)
- Request permissions on user interaction (button click)
- Handle permission denials gracefully

## 🎯 Production Checklist

- [ ] Arduino code uploaded and tested
- [ ] Baud rate matches (9600)
- [ ] USB cable connected
- [ ] App deployed to HTTPS URL
- [ ] Chrome/Edge browser installed on tablet
- [ ] USB permissions granted
- [ ] Coin sensor calibrated
- [ ] Buttons tested and debounced
- [ ] Error handling implemented
- [ ] Auto-reconnect enabled
- [ ] Connection status visible to users

## 💡 Tips

1. **Keep messages short**: Long messages can cause buffer overflow
2. **Always end with \n**: Newline is the message delimiter
3. **Test with Serial Monitor first**: Verify Arduino before connecting to app
4. **Use status LED**: Visual feedback helps debugging
5. **Log everything**: Console logs help troubleshoot issues

## 📚 Resources

- [Web Serial API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
- [Arduino Serial Reference](https://www.arduino.cc/reference/en/language/functions/communication/serial/)
- [Chrome Serial API Guide](https://web.dev/serial/)

---

**Need help?** Check the console logs for detailed error messages. Most connection issues are related to baud rate mismatch or cable problems.
