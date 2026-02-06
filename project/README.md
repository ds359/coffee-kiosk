# ☕ Coffee Kiosk Application

A modern, touch-friendly coffee vending kiosk with Arduino integration for automated dispensing.

## 🚀 Features

- **Touch-Optimized UI** - Designed for tablet kiosks
- **Arduino Integration** - USB/UART communication for automated dispensing
- **Flexible Portions** - Configurable small, medium, and large sizes
- **Payment Options** - Enable/disable payment mode
- **Admin Panel** - Secure PIN-protected settings
- **Maintenance Mode** - Temporarily disable service
- **Responsive Design** - Works on tablets and desktop browsers

## 📋 Quick Start

### 1. Deploy Application

```bash
# Install dependencies
npm install

# Deploy to Vercel
npm install -g vercel
vercel
```

**Important:** Edit `react-router.config.ts` and set `ssr: false` before deploying.

### 2. Upload Arduino Code

Upload the controller code from `ARDUINO_GUIDE.md` to your Arduino board.

### 3. Connect Hardware

1. Open app in Chrome browser (HTTPS required)
2. Click "Connect Arduino" button
3. Select Arduino port
4. Grant permissions

## 🔌 Arduino Commands

### App → Arduino

- **`S###`** - Dose coffee command
  - `###` = amount in milliliters
  - Examples: `S30`, `S50`, `S100`, `S300`
  - Sent when dosing screen loads
  - Arduino should activate pump to dispense the specified amount

### Arduino → App

- **`D###`** - Dosing progress update
  - `###` = progress percentage (0-100)
  - Examples: `D0`, `D25`, `D50`, `D75`, `D100`
  - Send during dosing to update progress bar in real-time
  - Recommend sending updates every 100-500ms
  - App automatically navigates to thank you screen when `D100` received

- **`F#`** - Dosing result status
  - `#` = `1` (success) or `0` (fail)
  - Send after `D100` to indicate if dosing succeeded or failed
  - `F1` = Success - coffee dispensed successfully
  - `F0` = Fail - error during dispensing
  - App displays success/fail message on thank you screen

### How It Works

1. User selects portion size on kiosk (e.g., "Medium")
2. App navigates to dosing screen
3. App sends `S50` command to Arduino (for 50ml medium)
4. Arduino activates pump and sends progress: `D0`, `D25`, `D50`, `D75`, `D100`
5. App updates progress bar in real-time
6. Arduino sends result: `F1` (success) or `F0` (fail)
7. App shows "Thank You" screen with success/fail message

### Arduino Implementation

```cpp
void handleCommand(String cmd) {
  if (cmd.startsWith("S")) {
    int amount = cmd.substring(1).toInt();
    
    if (amount > 0 && amount <= 500) {
      int totalTime = amount * 100; // 1ml = 100ms
      int updateInterval = 100; // Update every 100ms
      int elapsed = 0;
      
      digitalWrite(PUMP_PIN, HIGH);
      
      while (elapsed < totalTime) {
        delay(updateInterval);
        elapsed += updateInterval;
        
        int progress = (elapsed * 100) / totalTime;
        if (progress > 100) progress = 100;
        
        Serial.print("D");
        Serial.println(progress);
      }
      
      digitalWrite(PUMP_PIN, LOW);
      Serial.println("D100");
      
      // Send result status
      Serial.println("F1"); // Success
    }
  }
}
```

## ⚙️ Configuration

Access admin settings by clicking the Settings icon and entering PIN (default: 1111).

### Portion Settings

Configure each portion size:
- **Name:** Small, Medium, Large
- **Amount:** Volume in ml (sent as `S###` command)
- **Price:** Cost in dollars
- **Enabled:** Show/hide portion button

**Example Configuration:**
- Small: 30ml, $2.50
- Medium: 50ml, $3.00
- Large: 70ml, $3.50

### Other Settings

- **Coffee Name & Description**
- **Admin PIN** (change from default!)
- **No Payment Mode** (free coffee)
- **Maintenance Mode** (disable service)

## 📖 Documentation

- **[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** - Complete deployment guide
- **[ARDUINO_GUIDE.md](ARDUINO_GUIDE.md)** - Arduino setup and code
- **[ARDUINO_INTEGRATION_EXAMPLES.md](ARDUINO_INTEGRATION_EXAMPLES.md)** - Advanced integration examples

## 🛠️ Tech Stack

- React 19
- TypeScript
- React Router v7
- Vite
- CSS Modules
- Web Serial API

## 🔒 Browser Requirements

- ✅ Chrome 89+ (recommended)
- ✅ Edge 89+
- ❌ Firefox (Web Serial API not supported)
- ❌ Safari (Web Serial API not supported)

## 📡 Communication Protocol

### App → Arduino

| Command | Description |
|---------|-------------|
| `S30` | Dose 30ml |
| `S50` | Dose 50ml |
| `S100` | Dose 100ml |

### Arduino → App

| Message | Description |
|---------|-------------|
| `D25` | Dosing 25% complete |
| `D50` | Dosing 50% complete |
| `D100` | Dosing complete |
| `F1` | Dosing success |
| `F0` | Dosing failed |
| `STATUS:ready` | Arduino ready |
| `ERROR:invalid_amount` | Invalid amount requested |

## 🧪 Testing

### Test Without Arduino

The app works without Arduino connected (simulation mode). Just:
1. Open app in browser
2. Select coffee size
3. Navigate through flow
4. Arduino commands will be logged to console

### Test With Arduino

1. Upload Arduino code
2. Open Serial Monitor (9600 baud)
3. Type test commands:
   - `S50` → Should dose 50ml
   - `S100` → Should dose 100ml
   - `STATUS` → Should reply "STATUS:ready"

## 🎯 Production Checklist

- [ ] Deployed to Vercel with `ssr: false`
- [ ] Arduino code uploaded and tested
- [ ] Dosing amounts calibrated
- [ ] Flow rate adjusted for pump
- [ ] Portion prices configured
- [ ] Admin PIN changed from default
- [ ] USB cable secured
- [ ] Kiosk in fullscreen mode
- [ ] Emergency stop accessible

## 🔧 Troubleshooting

### Arduino Not Connecting

1. Check USB cable (data cable, not power-only)
2. Use Chrome or Edge browser
3. Ensure app is on HTTPS
4. Grant browser permissions
5. Try different USB port

### Wrong Amount Dispensed

1. Check portion amount in Settings
2. Verify `S###` command in console
3. Calibrate flow rate in Arduino code:
   ```cpp
   int dispensingTime = amount * YOUR_CALIBRATION_VALUE;
   ```
4. Test with small amounts first

### Commands Not Working

1. Open browser console (F12)
2. Look for "Arduino command sent: S###"
3. Open Arduino Serial Monitor
4. Check baud rate (9600)
5. Verify Arduino code has `handleCommand()`

## 📞 Support

For issues or questions:
1. Check documentation files
2. Review browser console logs
3. Test Arduino with Serial Monitor
4. Verify Web Serial API compatibility

## 📄 License

This project is provided as-is for kiosk deployments.

---

**Built with ❤️ for coffee lovers**
