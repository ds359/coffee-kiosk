# Dosing Progress Command: D###

## Overview

The `D###` command allows Arduino to send real-time progress updates during coffee dosing. The app displays this progress on a visual progress bar, providing immediate feedback to users.

## Command Format

```
D###
```

Where `###` is a number from 0 to 100 representing the completion percentage.

## Examples

- `D0` → 0% complete (just started)
- `D25` → 25% complete
- `D50` → 50% complete (halfway)
- `D75` → 75% complete
- `D100` → 100% complete (finished)

## How It Works

### 1. App Flow
1. User selects coffee portion size (e.g., Medium = 50ml)
2. App navigates to dosing screen
3. App sends `S50` command to Arduino
4. Progress bar shows 0%
5. Arduino sends `D###` updates during dosing
6. Progress bar updates in real-time
7. When `D100` received, app navigates to "Thank You" screen

### 2. Arduino Implementation

```cpp
void handleCommand(String cmd) {
  if (cmd.startsWith("S")) {
    int amount = cmd.substring(1).toInt();
    
    if (amount > 0 && amount <= 500) {
      int totalTime = amount * 100; // 1ml = 100ms (calibrate for your pump)
      int updateInterval = 100;     // Send update every 100ms
      int elapsed = 0;
      
      // Start pump
      digitalWrite(PUMP_PIN, HIGH);
      
      // Dispense with progress updates
      while (elapsed < totalTime) {
        delay(updateInterval);
        elapsed += updateInterval;
        
        // Calculate percentage (0-100)
        int progress = (elapsed * 100) / totalTime;
        if (progress > 100) progress = 100;
        
        // Send progress to app
        Serial.print("D");
        Serial.println(progress);
      }
      
      // Stop pump
      digitalWrite(PUMP_PIN, LOW);
      
      // Send completion
      Serial.println("D100");
      Serial.println("STATUS:complete");
    }
  }
}
```

## Update Frequency

**Recommended:** Send progress every 100-500ms

- **Too fast (<50ms):** May overwhelm serial buffer and app processing
- **Too slow (>1000ms):** Progress bar appears choppy/laggy
- **Sweet spot (100-500ms):** Smooth updates, efficient communication

## Progress Calculation

```cpp
// For a 50ml dose at 1ml = 100ms
totalTime = 50 * 100 = 5000ms (5 seconds)

// At 1 second (1000ms elapsed):
progress = (1000 * 100) / 5000 = 20%
Serial.println("D20");

// At 2.5 seconds (2500ms elapsed):
progress = (2500 * 100) / 5000 = 50%
Serial.println("D50");

// At 5 seconds (5000ms elapsed):
progress = (5000 * 100) / 5000 = 100%
Serial.println("D100");
```

## Complete Example

### Arduino Code with Progress

```cpp
const int PUMP_PIN = 10;
const int FLOW_RATE = 100; // ms per ml (calibrate!)

void setup() {
  Serial.begin(9600);
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, LOW);
  Serial.println("STATUS:ready");
}

void loop() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    handleCommand(cmd);
  }
}

void handleCommand(String cmd) {
  if (cmd.startsWith("S")) {
    int amount = cmd.substring(1).toInt();
    
    if (amount < 1 || amount > 500) {
      Serial.println("ERROR:invalid_amount");
      return;
    }
    
    // Calculate total dispensing time
    int totalTime = amount * FLOW_RATE;
    int updateInterval = 100;
    int elapsed = 0;
    
    // Start dosing
    digitalWrite(PUMP_PIN, HIGH);
    Serial.print("STATUS:dosing_");
    Serial.println(amount);
    
    // Dispense with progress updates
    while (elapsed < totalTime) {
      delay(updateInterval);
      elapsed += updateInterval;
      
      int progress = min(100, (elapsed * 100) / totalTime);
      Serial.print("D");
      Serial.println(progress);
    }
    
    // Stop dosing
    digitalWrite(PUMP_PIN, LOW);
    Serial.println("D100");
    Serial.println("STATUS:complete");
  }
}
```

## Testing

### 1. Test in Serial Monitor

1. Open Arduino Serial Monitor (9600 baud)
2. Send: `S50`
3. Expected output:
   ```
   STATUS:dosing_50
   D2
   D4
   D6
   ...
   D98
   D100
   STATUS:complete
   ```

### 2. Test with App

1. Connect Arduino to app
2. Select coffee size
3. Watch progress bar update smoothly
4. Verify completion → "Thank You" screen

## Troubleshooting

### Progress Bar Not Updating

**Symptoms:** Bar stays at 0% or jumps to 100%

**Solutions:**
- Check Arduino is sending `D###` commands (Serial Monitor)
- Verify format is exactly `D` + number + newline
- Check update interval (100-500ms recommended)
- Look for errors in browser console (F12)

### Progress Updates Too Fast/Slow

**Symptoms:** Choppy or laggy progress bar

**Solutions:**
```cpp
// Too fast (every 10ms)
int updateInterval = 10; // ❌ Too many updates

// Too slow (every 2 seconds)
int updateInterval = 2000; // ❌ Appears frozen

// Just right
int updateInterval = 100; // ✅ Smooth updates
```

### Progress Exceeds 100%

**Symptoms:** Progress goes above 100%

**Solution:**
```cpp
// Add safety cap
int progress = (elapsed * 100) / totalTime;
if (progress > 100) progress = 100; // ✅ Cap at 100
Serial.print("D");
Serial.println(progress);
```

## Advanced Features

### Non-Linear Progress

For pumps with varying flow rates:

```cpp
// Calculate actual volume dispensed
float volumeDispensed = measureVolume(); // Your sensor
int progress = (int)((volumeDispensed / amount) * 100);
Serial.print("D");
Serial.println(progress);
```

### Error Recovery

Handle pump stalls or blockages:

```cpp
if (flowSensorDetectsBlockage()) {
  Serial.println("ERROR:blockage_detected");
  digitalWrite(PUMP_PIN, LOW);
  return;
}
```

### Multi-Stage Progress

For complex recipes (grind → dose → tamp):

```cpp
// Stage 1: Grinding (0-33%)
for (int i = 0; i <= 33; i += 5) {
  Serial.print("D"); Serial.println(i);
  delay(100);
}

// Stage 2: Dosing (34-66%)
for (int i = 34; i <= 66; i += 5) {
  Serial.print("D"); Serial.println(i);
  delay(100);
}

// Stage 3: Tamping (67-100%)
for (int i = 67; i <= 100; i += 5) {
  Serial.print("D"); Serial.println(i);
  delay(100);
}
```

## Best Practices

1. ✅ **Always send D100** when complete (triggers navigation)
2. ✅ **Cap progress at 100%** (never exceed)
3. ✅ **Use consistent intervals** (100-500ms)
4. ✅ **Include error handling** (invalid amounts, blockages)
5. ✅ **Test with Serial Monitor first** (before connecting to app)
6. ✅ **Send newline after each command** (`Serial.println()`)
7. ✅ **Validate input ranges** (0-500ml)

## Summary

The `D###` command provides real-time visual feedback during coffee dispensing:

- **Format:** `D` + percentage (0-100)
- **Frequency:** Every 100-500ms
- **Purpose:** Update progress bar in real-time
- **Completion:** `D100` triggers navigation to thank you screen
- **Pairing:** Works with `S###` dosing command

This creates a professional, responsive user experience where customers can see exactly how their coffee is progressing.
