import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import styles from "./selection.module.css";

interface PortionSettings {
  enabled: boolean;
  price: number;
  amount: number;
}

export default function Selection() {
  const navigate = useNavigate();
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [coffeeName, setCoffeeName] = useState("");
  const [coffeeDescription, setCoffeeDescription] = useState("");

  const [portions, setPortions] = useState<{
    small: PortionSettings;
    medium: PortionSettings;
    large: PortionSettings;
  }>({
    small: { enabled: true, price: 2.5, amount: 30 },
    medium: { enabled: true, price: 3.0, amount: 50 },
    large: { enabled: true, price: 3.5, amount: 70 },
  });

  const [noPaymentMode, setNoPaymentMode] = useState(false);

  useEffect(() => {
    const mode = localStorage.getItem("stopWorkMode") === "true";
    setMaintenanceMode(mode);

    setCoffeeName(localStorage.getItem("coffeeName") || "Premium Espresso");
    setCoffeeDescription(localStorage.getItem("coffeeDescription") || "Rich, aromatic espresso");

    setPortions({
      small: {
        enabled: localStorage.getItem("enableSmall") !== "false",
        price: parseFloat(localStorage.getItem("priceSmall") || "2.50"),
        amount: parseInt(localStorage.getItem("amountSmall") || "30"),
      },
      medium: {
        enabled: localStorage.getItem("enableMedium") !== "false",
        price: parseFloat(localStorage.getItem("priceMedium") || "3.00"),
        amount: parseInt(localStorage.getItem("amountMedium") || "50"),
      },
      large: {
        enabled: localStorage.getItem("enableLarge") !== "false",
        price: parseFloat(localStorage.getItem("priceLarge") || "3.50"),
        amount: parseInt(localStorage.getItem("amountLarge") || "70"),
      },
    });

    setNoPaymentMode(localStorage.getItem("noPaymentMode") === "true");
  }, []);

  const handlePortionSelect = (portion: "small" | "medium" | "large", price: number, amount: number) => {
    // If price is 0 or no payment mode is enabled, skip payment screen
    if (price === 0 || noPaymentMode) {
      navigate("/dosing", { state: { portion, amount } });
    } else {
      navigate("/payment", { state: { portion, price, amount } });
    }
  };

  const handleSettingsClick = () => {
    setShowPinDialog(true);
    setPin("");
    setPinError(false);

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      closePinDialog();
    }, 5000);
    setAutoCloseTimer(timer);
  };

  const closePinDialog = () => {
    setShowPinDialog(false);
    setPin("");
    setPinError(false);
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      setAutoCloseTimer(null);
    }
    // Return to home screen
    navigate("/");
  };

  const handlePinSubmit = () => {
    const storedPin = localStorage.getItem("adminPin") || "1111";
    if (pin === storedPin) {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
      navigate("/settings");
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2000);
    }
  };

  const handlePinChange = (value: string) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setPin(value);
      setPinError(false);
    }
  };

  useEffect(() => {
    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [autoCloseTimer]);

  return (
    <div className={styles.selectionScreen}>
      <div className={styles.overlay} />

      <button className={styles.settingsButton} onClick={handleSettingsClick}>
        <Settings size={24} />
      </button>

      {showPinDialog && (
        <div className={styles.pinOverlay}>
          <div className={styles.pinDialog}>
            <h2 className={styles.pinTitle}>Enter PIN</h2>
            <input
              type="password"
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              className={`${styles.pinInput} ${pinError ? styles.pinInputError : ""}`}
              placeholder="Enter 4-digit PIN"
              maxLength={4}
              autoFocus
            />
            {pinError && <p className={styles.pinErrorMessage}>Incorrect PIN</p>}
            <div className={styles.pinButtons}>
              <button className={styles.pinBackButton} onClick={closePinDialog}>
                Back
              </button>
              <button className={styles.pinSubmitButton} onClick={handlePinSubmit} disabled={pin.length !== 4}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.coffeeInfo}>
          <h1 className={styles.coffeeName}>{coffeeName}</h1>
          <p className={styles.coffeeDescription}>{coffeeDescription}</p>
        </div>

        {maintenanceMode && (
          <div className={styles.stopWorkOverlay}>
            <p className={styles.stopWorkMessage}>Temporarily Out of Service</p>
          </div>
        )}

        <div className={`${styles.portionButtons} ${maintenanceMode ? styles.disabled : ""}`}>
          {portions.small.enabled && (
            <button
              className={styles.portionButton}
              onClick={() => handlePortionSelect("small", portions.small.price, portions.small.amount)}
              disabled={maintenanceMode}
            >
              <div className={styles.portionSize}>Small</div>
              <div className={styles.portionPrice}>
                {portions.small.price === 0 ? "FREE" : `$${portions.small.price.toFixed(2)}`}
              </div>
              <div className={styles.portionVolume}>{portions.small.amount}ml</div>
            </button>
          )}

          {portions.medium.enabled && (
            <button
              className={styles.portionButton}
              onClick={() => handlePortionSelect("medium", portions.medium.price, portions.medium.amount)}
              disabled={maintenanceMode}
            >
              <div className={styles.portionSize}>Medium</div>
              <div className={styles.portionPrice}>
                {portions.medium.price === 0 ? "FREE" : `$${portions.medium.price.toFixed(2)}`}
              </div>
              <div className={styles.portionVolume}>{portions.medium.amount}ml</div>
            </button>
          )}

          {portions.large.enabled && (
            <button
              className={styles.portionButton}
              onClick={() => handlePortionSelect("large", portions.large.price, portions.large.amount)}
              disabled={maintenanceMode}
            >
              <div className={styles.portionSize}>Large</div>
              <div className={styles.portionPrice}>
                {portions.large.price === 0 ? "FREE" : `$${portions.large.price.toFixed(2)}`}
              </div>
              <div className={styles.portionVolume}>{portions.large.amount}ml</div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
