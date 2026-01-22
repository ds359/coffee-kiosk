import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Coffee } from "lucide-react";
import styles from "./dosing.module.css";

export default function Dosing() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
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

    const timeout = setTimeout(() => {
      navigate("/thank-you");
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [navigate]);

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
