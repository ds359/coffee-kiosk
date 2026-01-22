import { useEffect } from "react";
import { useNavigate } from "react-router";
import { CheckCircle } from "lucide-react";
import styles from "./thank-you.module.css";

export default function ThankYou() {
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate("/");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className={styles.thankYouScreen}>
      <div className={styles.overlay} />
      <div className={styles.content}>
        <div className={styles.thankYouCard}>
          <div className={styles.successIcon}>
            <CheckCircle size={100} strokeWidth={2} />
          </div>
          <h1 className={styles.thankYouTitle}>Thank You!</h1>
          <p className={styles.thankYouMessage}>
            Your coffee is ready. Please collect it from the dispenser.
          </p>
          <p className={styles.farewell}>
            Enjoy your premium coffee experience!
          </p>
        </div>
      </div>
    </div>
  );
}
