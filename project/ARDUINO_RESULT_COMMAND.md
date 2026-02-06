# Arduino Result Command: F#

## Overview

The `F#` command allows Arduino to report the success or failure of coffee dosing operations. This enables the application to display appropriate messages to users based on the actual outcome.

## Command Format

**Arduino → App**

```
F1  // Success - coffee dispensed successfully
F0  // Fail - error occurred during dispensing
```

## When to Send

Send the `F#` result command **after** sending `D100` (dosing complete):

```cpp
void handleCommand(String cmd) {
  if (cmd.startsWith("S")) {
    int amount = cmd.substring(1).toInt();
    bool success = true; // Track dosing result
    
    // ... perform dosing ...
    
    // Send completion signal
    Serial.println("D100");
    
    // Send result status
    if (success) {
      Serial.println("F1"); // Success
    } else {
      Serial.println("F0"); // Fail
    }
  }
}
```

## Success Criteria (F1)

Send `F1` when dosing completes successfully:

- ✅ Full amount dispensed
- ✅ No sensor errors detected
- ✅ Pump operated correctly
- ✅ No timeout occurred
- ✅ Coffee level sufficient

## Failure Criteria (F0)

Send `F0` when any error occurs:

- ❌ Coffee empty / level too low
- ❌ Pump failure or blockage
- ❌ Sensor malfunction
- ❌ Timeout exceeded
- ❌ Hardware error
- ❌ Invalid dosing amount

## Complete Arduino Example

```cpp
const int PUMP_PIN = 10;
const int LEVEL_SENSOR = A1; // Coffee level sensor
const int MIN_LEVEL = 100;   // Minimum coffee level threshold

void handleCommand(String cmd) {
  if (cmd.startsWith("S")) {
    int amount = cmd.substring(1).toInt();
    
    if (amount <= 0 || amount > 500) {
      Serial.println("ERROR:invalid_amount");
      Serial.println("F0"); // Invalid = fail
      return;
    }
    
    // Check coffee level before starting
    int coffeeLevel = analogRead(LEVEL_SENSOR);
    if (coffeeLevel < MIN_LEVEL) {
      Serial.println("ERROR:coffee_empty");
      Serial.println("F0"); // Empty = fail
      return;
    }
    
    bool success = true;
    int totalTime = amount * 100; // 1ml = 100ms
    int updateInterval = 100;
    int elapsed = 0;
    
    // Activate pump
    digitalWrite(PUMP_PIN, HIGH);
    
    // Dispense with progress updates
    while (elapsed < totalTime) {
      delay(updateInterval);
      elapsed += updateInterval;
      
      // Check for errors during dosing
      if (analogRead(LEVEL_SENSOR) < MIN_LEVEL) {
        success = false; // Coffee ran out
        break;
      }
      
      // Check pump current (optional - requires current sensor)
      // if (pumpCurrent < MIN_CURRENT) {
      //   success = false; // Pump failure or blockage
      //   break;
      // }
      
      // Send progress update
      int progress = (elapsed * 100) / totalTime;
      if (progress > 100) progress = 100;
      
      Serial.print("D");
      Serial.println(progress);
    }
    
    // Deactivate pump
    digitalWrite(PUMP_PIN, LOW);
    
    // Send completion
    Serial.println("D100");
    
    // Send result based on success flag
    if (success) {
      Serial.println("F1"); // Success
    } else {
      Serial.println("F0"); // Fail
      Serial.println("ERROR:dosing_failed");
    }
  }
}
```

## App Behavior

The application responds to the result command:

**When `F1` received (Success):**
- ✅ Green checkmark icon
- 🎉 "Thank You!" message
- ☕ "Your coffee is ready. Please collect it from the dispenser."
- 💚 "Enjoy your premium coffee experience!"

**When `F0` received (Fail):**
- ⚠️ Orange/red alert icon
- 😞 "Oops!" message
- 🔧 "Something went wrong during preparation. Please contact staff."
- 🙏 "We apologize for the inconvenience."

## Message Sequence

Complete dosing sequence with result:

```
App → Arduino: S50
Arduino → App: D0
Arduino → App: D20
Arduino → App: D40
Arduino → App: D60
Arduino → App: D80
Arduino → App: D100
Arduino → App: F1      ← Result status
```

If an error occurs mid-dosing:

```
App → Arduino: S50
Arduino → App: D0
Arduino → App: D20
Arduino → App: D40
Arduino → App: D100    ← Stopped early
Arduino → App: F0      ← Failure status
Arduino → App: ERROR:coffee_empty
```

## Testing

### Test Success Case

1. Open Arduino Serial Monitor
2. Send command: `S50`
3. Wait for dosing sequence
4. Verify output:
   ```
   D0
   D20
   D40
   D60
   D80
   D100
   F1
   ```

### Test Failure Case

Simulate failure by disconnecting level sensor or blocking pump:

```
D0
D20
D40
D100
F0
ERROR:coffee_empty
```

## Best Practices

1. **Always send F# after D100** - Never leave result unreported
2. **Track errors throughout dosing** - Don't just check at start
3. **Use descriptive error messages** - Helps debugging
4. **Default to success** - Only set to fail if actual error detected
5. **Log failures** - Keep track for maintenance
6. **Test all failure modes** - Empty coffee, blocked pump, sensor errors

## Error Recovery

When `F0` is sent:

1. **App displays error to user**
2. **User contacts staff**
3. **Staff checks:**
   - Coffee level
   - Pump operation
   - Tube blockage
   - Sensor functionality
4. **Refill/repair as needed**
5. **Test with `S10` (small test dose)**
6. **Resume normal operation**

## Common Failure Scenarios

| Scenario | Detection | Result |
|----------|-----------|--------|
| Coffee empty | Level sensor < threshold | F0 |
| Pump blocked | Current sensor < minimum | F0 |
| Sensor disconnected | Reading = 0 or max | F0 |
| Timeout | Time > expected | F0 |
| Invalid amount | Amount < 0 or > 500 | F0 |
| Hardware error | Any system fault | F0 |

## Integration with App

The result status is stored in navigation state:

```typescript
// In dosing.tsx
navigate("/thank-you", { 
  state: { 
    success: dosingResult !== 'fail'
  } 
});
```

The thank-you page uses this to show appropriate UI:

```typescript
// In thank-you.tsx
const success = location.state?.success !== false;

{success ? (
  <CheckCircle /> // Green success icon
) : (
  <AlertCircle /> // Red/orange error icon
)}
```

## Monitoring & Analytics

Track failure rates for quality control:

```cpp
int totalDoses = 0;
int failedDoses = 0;

void handleCommand(String cmd) {
  if (cmd.startsWith("S")) {
    totalDoses++;
    
    // ... dosing logic ...
    
    if (!success) {
      failedDoses++;
      
      // Log failure rate
      float failureRate = (float)failedDoses / totalDoses * 100;
      Serial.print("STATS:failure_rate_");
      Serial.println(failureRate);
    }
  }
}
```

## Summary

The `F#` result command provides essential feedback about dosing outcomes:

- **F1** → Success - everything worked perfectly
- **F0** → Failure - error occurred, staff needed

This enables the kiosk to:
- Provide accurate user feedback
- Alert staff to maintenance issues
- Track equipment reliability
- Improve customer experience

Always send the result command after `D100` to close the dosing loop!
