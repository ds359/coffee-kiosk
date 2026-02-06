import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { Coffee } from "lucide-react";
import { useArduino } from "~/hooks/use-arduino";
import styles from "./dosing.module.css";

export default function Dosing() {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(5);
  const [isComplete, setIsComplete] = useState(false);
  const [dosingResult, setDosingResult] = useState<'success' | 'fail' | null>(null);

  // Get the coffee amount from navigation state (passed from selection page)
  const amount = location.state?.amount || 50; // Default to 50ml if not provided

  // Handle Arduino messages - dosing progress and result updates
  const handleArduinoMessage = useCallback((message: any) => {
    if (message.type === 'dosing') {
      // Arduino sends D### where ### is 0-100 percentage
      const dosingProgress = parseInt(message.data, 10);
      if (!isNaN(dosingProgress) && dosingProgress >= 0 && dosingProgress <= 100) {
        console.log(`Arduino dosing progress: ${dosingProgress}%`);
        setProgress(dosingProgress);
        
        // Mark as complete when 100%
        if (dosingProgress >= 100) {
          setIsComplete(true);
        }
      }
    } else if (message.type === 'result') {
      // Arduino sends F1 (success) or F0 (fail)
      console.log(`Arduino dosing result: ${message.data}`);
      setDosingResult(message.data === 'success' ? 'success' : 'fail');
    }
  }, []);

  const { send, isConnected } = useArduino(handleArduinoMessage);

  useEffect(() => {
    // Send Arduino command to start dosing
    const sendDosingCommand = async () => {
      if (isConnected) {
        try {
          // Send S### command where ### is the amount in ml
          await send(`S${amount}`);
          console.log(`Arduino command sent: S${amount}`);
        } catch (error) {
          console.error('Failed to send dosing command to Arduino:', error);
        }
      } else {
        console.warn('Arduino not connected, simulating dosing process');
      }
    };

    sendDosingCommand();

    // Fallback simulation if Arduino not connected
    let interval: NodeJS.Timeout | null = null;
    if (!isConnected) {
      console.log('Arduino not connected, using simulated progress');
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsComplete(true);
            return 100;
          }
          return prev + 20;
        });

        setTimeRemaining((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [send, amount, isConnected]);

  // Navigate to thank you page when dosing is complete
  useEffect(() => {
    if (isComplete) {
      const timeout = setTimeout(() => {
        navigate("/thank-you", { 
          state: { 
            success: dosingResult !== 'fail' // Success unless explicitly failed
          } 
        });
      }, 1500); // Wait 1.5s after completion before navigating

      return () => clearTimeout(timeout);
    }
  }, [isComplete, navigate, dosingResult]);

  return (
    <div className={styles.dosingScreen}>
      <div className={styles.overlay} />
      <div className={styles.content}>
        <div className={styles.dosingCard}>
          <h1 className={styles.dosingTitle}>Preparing Your Coffee</h1>
          
          <div className={styles.animationContainer}>
            <div className={styles.coffeeIcon}>
              <Coffee size={120} color="var(--color-accent-9)" strokeWidth={1.5} />
            </div>
          </div>

          <div className={styles.progressContainer}>
            <div className={styles.progressLabel}>
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className={styles.statusMessage}>
              {timeRemaining > 0 
                ? `Estimated time: ${timeRemaining} second${timeRemaining !== 1 ? 's' : ''}` 
                : 'Almost ready...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
