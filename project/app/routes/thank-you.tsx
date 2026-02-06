import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { CheckCircle, AlertCircle } from "lucide-react";
import styles from "./thank-you.module.css";

export default function ThankYou() {
  const navigate = useNavigate();
  const location = useLocation();
  const success = location.state?.success !== false; // Default to success

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
          <div className={success ? styles.successIcon : styles.errorIcon}>
            {success ? (
              <CheckCircle size={100} strokeWidth={2} />
            ) : (
              <AlertCircle size={100} strokeWidth={2} />
            )}
          </div>
          <h1 className={styles.thankYouTitle}>
            {success ? 'Thank You!' : 'Oops!'}
          </h1>
          <p className={styles.thankYouMessage}>
            {success 
              ? 'Your coffee is ready. Please collect it from the dispenser.'
              : 'Something went wrong during preparation. Please contact staff.'}
          </p>
          <p className={styles.farewell}>
            {success 
              ? 'Enjoy your premium coffee experience!'
              : 'We apologize for the inconvenience.'}
          </p>
        </div>
      </div>
    </div>
  );
}
