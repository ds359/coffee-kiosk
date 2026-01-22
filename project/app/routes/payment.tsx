import { useNavigate, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { Smartphone, QrCode } from "lucide-react";
import styles from "./payment.module.css";

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { portion, price, amount } = location.state || { portion: "medium", price: 3.0, amount: 50 };

  const [nfcEnabled, setNfcEnabled] = useState(true);
  const [qrEnabled, setQrEnabled] = useState(true);

  useEffect(() => {
    setNfcEnabled(localStorage.getItem("nfcEnabled") !== "false");
    setQrEnabled(localStorage.getItem("qrEnabled") !== "false");

    // Check if no payment mode is enabled - shouldn't get here if it is, but just in case
    const noPaymentMode = localStorage.getItem("noPaymentMode") === "true";
    if (noPaymentMode || price === 0) {
      navigate("/dosing", { state: { portion, amount }, replace: true });
    }
  }, [price, portion, amount, navigate]);

  const handleNext = () => {
    navigate("/dosing", { state: { portion, amount } });
  };

  return (
    <div className={styles.paymentScreen}>
      <div className={styles.overlay} />
      <div className={styles.content}>
        <div className={styles.paymentCard}>
          <h1 className={styles.paymentTitle}>Payment - ${price.toFixed(2)}</h1>

          <div className={styles.paymentMethods}>
            {nfcEnabled && (
              <>
                <div className={styles.nfcSection}>
                  <div className={styles.nfcIcon}>
                    <Smartphone size={48} color="var(--color-accent-9)" />
                  </div>
                  <p className={styles.nfcText}>Tap your phone here</p>
                  <div className={styles.nfcFrame}>
                    <div className={styles.nfcFrameInner}>NFC</div>
                  </div>
                </div>

                {qrEnabled && <div className={styles.divider}>OR</div>}
              </>
            )}

            {qrEnabled && (
              <div className={styles.qrSection}>
                <p className={styles.qrText}>Scan QR Code to pay</p>
                <div className={styles.qrCode}>
                  <QrCode size={120} color="var(--color-neutral-12)" />
                </div>
              </div>
            )}
          </div>

          <button className={styles.nextButton} onClick={handleNext}>
            Continue (Test Mode)
          </button>
        </div>
      </div>
    </div>
  );
}
