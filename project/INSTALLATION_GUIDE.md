# Coffee Kiosk Installation Guide

Complete setup guide for deploying the Coffee Kiosk application with Arduino integration.

## 📋 Table of Contents

- [System Requirements](#system-requirements)
- [Software Installation](#software-installation)
- [Arduino Setup](#arduino-setup)
- [Application Deployment](#application-deployment)
- [Hardware Configuration](#hardware-configuration)
- [Testing & Calibration](#testing--calibration)
- [Troubleshooting](#troubleshooting)

## 🖥️ System Requirements

### Tablet/Kiosk Computer
- **OS:** Android 10+, Windows 10+, or Linux
- **Browser:** Chrome 89+ or Edge 89+ (required for Web Serial API)
- **RAM:** 2GB minimum
- **Storage:** 500MB available
- **USB:** Full-size USB port or USB-C with OTG adapter
- **Network:** WiFi or Ethernet for initial setup

### Arduino Hardware
- **Board:** Arduino Uno, Nano, or Mega
- **USB Cable:** Data cable (not power-only)
- **Baud Rate:** 9600 (default)
- **Voltage:** 5V USB powered

## 💻 Software Installation

### 1. Install Chrome Browser

If not already installed on your kiosk device:

**Android:**
```bash
# Download from Google Play Store
# Or install via APK from chrome.google.com
```

**Windows/Linux:**
```bash
# Download from chrome.google.com
# Or use system package manager
```

### 2. Deploy Application to Vercel

**Option A: Using Dazl Export**

1. Export project from Dazl platform
2. Extract ZIP file
3. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
4. Deploy:
   ```bash
   cd coffee-kiosk-app
   vercel
   ```
5. Note the deployment URL (e.g., `https://your-app.vercel.app`)

**Option B: Using Git Repository**

1. Push code to GitHub/GitLab
2. Connect repository to Vercel
3. Configure build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `build/client`
4. Deploy

### 3. Configure Application

Edit `react-router.config.ts` to disable SSR (required for Web Serial API):

```typescript
export default {
  ssr: false,
  // ... other config
}
```

Redeploy after making this change.

## 🔌 Arduino Setup

### 1. Install Arduino IDE

Download from [arduino.cc](https://www.arduino.cc/en/software)

### 2. Upload Controller Code

See `ARDUINO_GUIDE.md` for complete Arduino code with dosing support.

**Key Commands:** The Arduino must handle `S###` command, send `D###` progress, and `F#` result:

```cpp
void handleCommand(String cmd) {
  // Handle dosing command: S### (e.g., S100 = 100ml)
  if (cmd.startsWith("S")) {
    int amount = cmd.substring(1).toInt();
    
    if (amount > 0 && amount <= 500) {
      int totalTime = amount * 100; // 1ml = 100ms
      int updateInterval = 100; // Update progress every 100ms
      int elapsed = 0;
      bool success = true;
      
      // Activate pump
      digitalWrite(PUMP_PIN, HIGH);
      
      // Dispense with progress updates
      while (elapsed < totalTime) {
        delay(updateInterval);
        elapsed += updateInterval;
        
        // Send progress percentage (0-100) to app
        int progress = (elapsed * 100) / totalTime;
        if (progress > 100) progress = 100;
        
        Serial.print("D");
        Serial.println(progress);
        
        // Check for errors during dosing
        // if (errorDetected()) {
        //   success = false;
        //   break;
        // }
      }
      
      // Deactivate pump
      digitalWrite(PUMP_PIN, LOW);
      
      // Send completion signal
      Serial.println("D100");
      
      // Send result: F1 (success) or F0 (fail)
      if (success) {
        Serial.println("F1");
      } else {
        Serial.println("F0");
      }
    }
  }
}
```

### 3. Test Arduino Connection

1. Open Arduino Serial Monitor (Tools → Serial Monitor)
2. Set baud rate to 9600
3. Test commands:
   - Type `S50` → Should see progress updates `D0`, `D20`, `D40`...`D100`, then `F1`
   - Type `S100` → Should see progress updates and `F1`

## 🚀 Application Deployment

### 1. Open Application on Kiosk

1. Open Chrome browser
2. Navigate to your Vercel URL: `https://your-app.vercel.app`
3. Bookmark the page for easy access
4. Enable fullscreen mode (F11 on desktop)

### 2. Configure Kiosk Settings

**Access Admin Panel:**
1. From any screen, click the Settings icon
2. Enter PIN (default: 1111)
3. Configure:
   - Coffee name and description
   - Portion sizes (small, medium, large)
   - Portion amounts in ml (default: 30ml, 50ml, 70ml)
   - Prices per portion
   - Enable/disable portions
   - Payment mode (on/off)
   - Maintenance mode

**Important:** The portion amounts you configure here are sent to Arduino as `S###` commands.

### 3. Connect Arduino

1. Connect Arduino via USB cable
2. Click "Connect Arduino" button (top-right)
3. Select correct port from browser dialog
4. Grant permissions
5. Verify "Connected" status appears

## ⚙️ Hardware Configuration

### Pin Assignments

```
Arduino Uno Pin Layout:
├── Digital Pins 2-9: Coffee selection buttons (optional)
├── Analog Pin A0: Coin sensor input (optional)
├── Digital Pin 13: Status LED
├── Digital Pin 10: Pump/Valve control (add to Arduino code)
└── USB: Connected to kiosk tablet
```

### Wiring Diagram

```
[Tablet USB] ─── [Arduino USB]
                      │
                      ├─ Pin 10 ─── [Relay] ─── [Coffee Pump]
                      │                              │
                      │                           [12V Power]
                      │
                      └─ Pin 13 ─── [LED] ─── [GND]
```

### Adding Pump Control

To control an actual coffee pump, add this to your Arduino code:

```cpp
const int PUMP_PIN = 10;

void setup() {
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, LOW); // Pump off initially
}

void handleCommand(String cmd) {
  if (cmd.startsWith("S")) {
    int amount = cmd.substring(1).toInt();
    
    // Activate pump
    digitalWrite(PUMP_PIN, HIGH);
    
    // Run for calculated time (adjust flow rate as needed)
    int dispensingTime = amount * 100; // 1ml = 100ms
    delay(dispensingTime);
    
    // Deactivate pump
    digitalWrite(PUMP_PIN, LOW);
  }
}
```

**Safety Note:** Use a relay module to control high-voltage pumps safely.

## 🧪 Testing & Calibration

### 1. Test Dosing Commands

**Test small portion (30ml):**
1. Select "Small" on kiosk
2. Complete payment (or skip if payment disabled)
3. Verify Arduino receives `S30` command
4. Measure actual output volume
5. Adjust flow rate calculation if needed

**Test medium portion (50ml):**
1. Select "Medium"
2. Verify `S50` command received
3. Measure output
4. Calibrate

**Test large portion (70ml):**
1. Select "Large"
2. Verify `S70` command received
3. Measure output
4. Calibrate

### 2. Calibrate Flow Rate

The default calculation is `1ml = 100ms`. To calibrate:

1. Send `S100` command (request 100ml)
2. Measure actual output (e.g., 90ml)
3. Calculate ratio: `100ml / 90ml = 1.11`
4. Update Arduino code:
   ```cpp
   // Old: int dispensingTime = amount * 100;
   // New: int dispensingTime = amount * 111; // Calibrated
   ```
5. Retest and adjust

### 3. Test Full Flow

1. Start at home screen
2. Insert coin (if coin sensor connected)
3. Select coffee size
4. Complete payment
5. Verify dosing starts automatically
6. Wait for completion
7. Check "Thank You" screen appears

## 🔧 Troubleshooting

### Arduino Commands Not Working

**Problem:** Dosing doesn't start when portion selected

**Solutions:**
1. Check Arduino connection (green status indicator)
2. Open browser console (F12) → look for "Arduino command sent: S###"
3. Open Arduino Serial Monitor → verify command received
4. Check baud rate matches (9600)
5. Verify `handleCommand()` function in Arduino code

### Wrong Amount Dispensed

**Problem:** Arduino dispenses incorrect volume

**Solutions:**
1. Check portion amount in Settings
2. Verify `S###` command matches expected amount
3. Calibrate flow rate (see Testing section)
4. Check pump voltage and pressure
5. Ensure tubes are not blocked

### Connection Drops

**Problem:** Arduino disconnects during operation

**Solutions:**
1. Use high-quality USB cable
2. Check tablet USB power settings
3. Add strain relief to cable
4. Implement auto-reconnect (see ARDUINO_GUIDE.md)
5. Check for loose connections

### Browser Permissions Denied

**Problem:** Can't connect to Arduino

**Solutions:**
1. Use Chrome or Edge (Firefox/Safari not supported)
2. Ensure app is on HTTPS (Vercel provides this)
3. Click "Connect Arduino" button (don't auto-connect)
4. Clear browser site permissions and retry
5. Try different USB port

## 📊 Command Protocol Reference

### App → Arduino Commands

| Command | Format | Description | Example |
|---------|--------|-------------|---------|
| Dose coffee | `S###\n` | Dose specified amount in ml | `S100` = 100ml |

### Arduino → App Messages

| Message | Format | Description | Example |
|---------|--------|-------------|---------|
| Dosing progress | `D###` | Progress percentage (0-100) | `D50` = 50% done |
| Result status | `F#` | Success (1) or Fail (0) | `F1` = success |
| Status update | `STATUS:state` | Current Arduino state | `STATUS:ready` |
| Error | `ERROR:message` | Error occurred | `ERROR:invalid_amount` |
| Coin detected | `COIN:amount` | Coin sensor (optional) | `COIN:5.00` |
| Button pressed | `BUTTON:name` | Button input (optional) | `BUTTON:espresso` |

## 🎯 Production Checklist

Before going live:

- [ ] Arduino code uploaded and tested
- [ ] Dosing calibration completed
- [ ] All portion sizes tested (small, medium, large)
- [ ] Flow rate calibrated for accuracy
- [ ] USB cable secured with strain relief
- [ ] Tablet in fullscreen mode
- [ ] Auto-start on boot configured (optional)
- [ ] Admin PIN changed from default
- [ ] Payment mode configured correctly
- [ ] Prices set correctly
- [ ] Maintenance mode disabled
- [ ] Emergency stop accessible
- [ ] Backup power for Arduino (optional)
- [ ] Error logging enabled
- [ ] Customer-facing display tested

## 🔒 Security Recommendations

1. **Change default PIN:** Settings → Admin PIN (default: 1111)
2. **Use HTTPS:** Required for Web Serial API (Vercel provides)
3. **Restrict USB access:** Physical security for Arduino
4. **Validate amounts:** Arduino should reject invalid `S###` commands
5. **Implement limits:** Maximum dose per session
6. **Log transactions:** For accounting and debugging
7. **Secure admin panel:** Don't leave settings screen open

## 📱 Kiosk Mode Setup (Optional)

### Android Tablet

Use Kiosk Browser app or Chrome Managed Mode:

```
1. Install Kiosk Browser from Play Store
2. Configure start URL: https://your-app.vercel.app
3. Enable fullscreen
4. Disable address bar
5. Set as launcher app
6. Lock home button
```

### Windows

Use Chrome in kiosk mode:

```batch
chrome.exe --kiosk --app="https://your-app.vercel.app"
```

Add to Windows startup folder for auto-launch.

## 📞 Support Resources

- Arduino Guide: `ARDUINO_GUIDE.md`
- Integration Examples: `ARDUINO_INTEGRATION_EXAMPLES.md`
- Web Serial API Docs: [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
- Vercel Deployment: [Vercel Docs](https://vercel.com/docs)

---

**Installation Complete!** Your coffee kiosk is ready to serve customers. Test thoroughly before production use.
