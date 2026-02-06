import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Droplet,
  Settings,
  Sparkles,
  PowerOff,
  ArrowLeft,
  Minus,
  Plus,
  Lock,
  Languages,
  Globe,
  Cpu,
  Palette,
  CreditCard,
  FileText,
  Pause,
  X,
  CheckCircle,
  Save,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useArduino } from "../hooks/use-arduino";
import styles from "./settings.module.css";

type ServiceView =
  | "menu"
  | "sampler"
  | "cleaning"
  | "settings"
  | "change-pin"
  | "language"
  | "api-settings"
  | "arduino-settings"
  | "interface-settings"
  | "payment-settings"
  | "log-file";

interface LogEntry {
  id: string;
  timestamp: Date;
  type: "transaction" | "pouring" | "settings" | "cleaning" | "error";
  message: string;
}

interface InterfaceSettings {
  name: string;
  description: string;
  imageUrl: string;
  priceSmall: number;
  priceMedium: number;
  priceLarge: number;
  amountSmall: number;
  amountMedium: number;
  amountLarge: number;
  enableSmall: boolean;
  enableMedium: boolean;
  enableLarge: boolean;
}

export default function ServiceMenuScreen() {
  const navigate = useNavigate();
  const [view, setView] = useState<ServiceView>("menu");
  const [previousView, setPreviousView] = useState<ServiceView | null>(null);
  const [samplerVolume, setSamplerVolume] = useState(20);
  const [samplerAnimating, setSamplerAnimating] = useState(false);
  const [cleaningPhase, setCleaningPhase] = useState<"chemical" | "waiting" | "water" | "completed" | null>(null);
  const [cleaningPaused, setCleaningPaused] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(() => {
    return localStorage.getItem("stopWorkMode") === "true";
  });

  // PIN settings
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");

  // Language settings
  const [language, setLanguage] = useState<"en" | "uk">(() => {
    return (localStorage.getItem("language") as "en" | "uk") || "en";
  });

  // API settings
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem("apiUrl") || "");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("apiKey") || "");

  // Interface settings
  const [interfaceSettings, setInterfaceSettings] = useState<InterfaceSettings>(() => ({
    name: localStorage.getItem("coffeeName") || "Premium Espresso",
    description: localStorage.getItem("coffeeDescription") || "Rich, aromatic espresso",
    imageUrl: localStorage.getItem("coffeeImage") || "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04",
    priceSmall: parseFloat(localStorage.getItem("priceSmall") || "2.50"),
    priceMedium: parseFloat(localStorage.getItem("priceMedium") || "3.00"),
    priceLarge: parseFloat(localStorage.getItem("priceLarge") || "3.50"),
    amountSmall: parseInt(localStorage.getItem("amountSmall") || "30"),
    amountMedium: parseInt(localStorage.getItem("amountMedium") || "50"),
    amountLarge: parseInt(localStorage.getItem("amountLarge") || "70"),
    enableSmall: localStorage.getItem("enableSmall") !== "false",
    enableMedium: localStorage.getItem("enableMedium") !== "false",
    enableLarge: localStorage.getItem("enableLarge") !== "false",
  }));

  // Payment settings
  const [paymentSettings, setPaymentSettings] = useState(() => ({
    nfcEnabled: localStorage.getItem("nfcEnabled") !== "false",
    qrEnabled: localStorage.getItem("qrEnabled") !== "false",
    noPaymentMode: localStorage.getItem("noPaymentMode") === "true",
    merchantId: localStorage.getItem("merchantId") || "",
  }));

  // Logs
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem("systemLogs");
    if (saved) {
      const parsedLogs = JSON.parse(saved);
      return parsedLogs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
    }
    return [];
  });

  const [logFilter, setLogFilter] = useState<LogEntry["type"] | "all">("all");

  // Arduino connection hook
  const arduino = useArduino();
  
  // Arduino settings state (always initialized)
  const connectionStatus: 'online' | 'offline' = arduino.isConnected ? 'online' : 'offline';
  const [coeff, setCoeff] = useState(() => parseFloat(localStorage.getItem('arduinoCoeff') || '2.02'));
  const [power, setPower] = useState(() => parseInt(localStorage.getItem('arduinoPower') || '60'));
  const [volume, setVolume] = useState(() => parseFloat(localStorage.getItem('arduinoVolume') || '3.0'));
  const [waiting, setWaiting] = useState(() => parseInt(localStorage.getItem('arduinoWaiting') || '3'));
  const [displayEnabled, setDisplayEnabled] = useState(() => localStorage.getItem('arduinoDisplayEnabled') !== 'false');
  const [firmwareVersion] = useState('1.11.2.2334');
  const [lastUpdate] = useState('01.01.2025');
  
  // Calibration dialog state
  const [calibrationDialogOpen, setCalibrationDialogOpen] = useState(false);
  const [countedImpulses, setCountedImpulses] = useState<number | null>(null);
  const [realVolume, setRealVolume] = useState<number>(0);
  const [calibrationStarted, setCalibrationStarted] = useState(false);
  
  // Connection settings dialog state
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);

  const addLog = (type: LogEntry["type"], message: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      message,
    };
    const updatedLogs = [newLog, ...logs].slice(0, 100); // Keep last 100 logs
    setLogs(updatedLogs);
    localStorage.setItem("systemLogs", JSON.stringify(updatedLogs));
  };

  const handleBack = () => {
    if (view === "menu") {
      navigate("/");
    } else if (previousView) {
      setView(previousView);
      setPreviousView(null);
    } else {
      setView("menu");
    }
  };

  const navigateToView = (newView: ServiceView, fromView?: ServiceView) => {
    if (fromView) {
      setPreviousView(fromView);
    }
    setView(newView);
  };

  const handleSampler = () => {
    setSamplerAnimating(true);
    addLog("pouring", `Sampler poured ${samplerVolume}ml`);
    setTimeout(() => {
      setSamplerAnimating(false);
    }, 2000);
  };

  const startCleaningSequence = () => {
    setCleaningPhase("chemical");
    addLog("cleaning", "Cleaning process started");
  };

  const pauseCleaning = () => {
    setCleaningPaused(true);
    addLog("cleaning", "Cleaning process paused");
  };

  const resumeCleaning = () => {
    setCleaningPaused(false);
    addLog("cleaning", "Cleaning process resumed");
  };

  const stopCleaning = () => {
    setCleaningPhase(null);
    setCleaningPaused(false);
    addLog("cleaning", "Cleaning process stopped");
  };

  const completeCleaning = () => {
    setCleaningPhase(null);
    setCleaningPaused(false);
    setView("cleaning");
    addLog("cleaning", "Cleaning process completed successfully");
  };

  const toggleMaintenanceMode = () => {
    const newMode = !maintenanceMode;
    setMaintenanceMode(newMode);
    localStorage.setItem("stopWorkMode", String(newMode));
    addLog("settings", `Maintenance mode ${newMode ? "enabled" : "disabled"}`);
  };

  const handleChangePIN = () => {
    const storedPin = localStorage.getItem("adminPin") || "1111";
    if (currentPin !== storedPin) {
      setPinError("Current PIN is incorrect");
      return;
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError("PIN must be 4 digits");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("PINs do not match");
      return;
    }
    localStorage.setItem("adminPin", newPin);
    addLog("settings", "Admin PIN changed");
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setPinError("");
    setView("settings");
  };

  const handleLanguageChange = (lang: "en" | "uk") => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
    addLog("settings", `Language changed to ${lang === "en" ? "English" : "Ukrainian"}`);
  };

  const handleSaveApiSettings = () => {
    localStorage.setItem("apiUrl", apiUrl);
    localStorage.setItem("apiKey", apiKey);
    addLog("settings", "API settings updated");
    setView("settings");
  };

  const handleSaveInterfaceSettings = () => {
    localStorage.setItem("coffeeName", interfaceSettings.name);
    localStorage.setItem("coffeeDescription", interfaceSettings.description);
    localStorage.setItem("coffeeImage", interfaceSettings.imageUrl);
    localStorage.setItem("priceSmall", interfaceSettings.priceSmall.toString());
    localStorage.setItem("priceMedium", interfaceSettings.priceMedium.toString());
    localStorage.setItem("priceLarge", interfaceSettings.priceLarge.toString());
    localStorage.setItem("amountSmall", interfaceSettings.amountSmall.toString());
    localStorage.setItem("amountMedium", interfaceSettings.amountMedium.toString());
    localStorage.setItem("amountLarge", interfaceSettings.amountLarge.toString());
    localStorage.setItem("enableSmall", interfaceSettings.enableSmall.toString());
    localStorage.setItem("enableMedium", interfaceSettings.enableMedium.toString());
    localStorage.setItem("enableLarge", interfaceSettings.enableLarge.toString());
    addLog("settings", "Interface settings updated");
    setView("settings");
  };

  const handleSavePaymentSettings = () => {
    localStorage.setItem("nfcEnabled", paymentSettings.nfcEnabled.toString());
    localStorage.setItem("qrEnabled", paymentSettings.qrEnabled.toString());
    localStorage.setItem("noPaymentMode", paymentSettings.noPaymentMode.toString());
    localStorage.setItem("merchantId", paymentSettings.merchantId);
    addLog("settings", "Payment settings updated");
    setView("settings");
  };

  useEffect(() => {
    if (cleaningPhase && !cleaningPaused) {
      let timer: NodeJS.Timeout;
      if (cleaningPhase === "chemical") {
        timer = setTimeout(() => setCleaningPhase("waiting"), 5000);
      } else if (cleaningPhase === "waiting") {
        timer = setTimeout(() => setCleaningPhase("water"), 3000);
      } else if (cleaningPhase === "water") {
        timer = setTimeout(() => setCleaningPhase("completed"), 5000);
      }
      return () => clearTimeout(timer);
    }
  }, [cleaningPhase, cleaningPaused]);

  const filteredLogs = logFilter === "all" ? logs : logs.filter((log) => log.type === logFilter);

  // Sampler View
  if (view === "sampler") {
    return (
      <div className={styles.serviceScreen}>
        <div className={styles.subHeader}>
          <button className={styles.backButton} onClick={handleBack}>
            <ArrowLeft size={24} />
            <span>Back</span>
          </button>
          <h2 className={styles.subTitle}>Sampler</h2>
        </div>

        <div className={styles.samplerContent}>
          <div className={styles.volumeControl}>
            <label className={styles.volumeLabel}>Sample Volume (ml)</label>
            <div className={styles.volumeInput}>
              <button
                className={styles.volumeButton}
                onClick={() => setSamplerVolume(Math.max(10, samplerVolume - 5))}
                disabled={samplerAnimating}
              >
                <Minus size={24} />
              </button>
              <div className={styles.volumeDisplay}>{samplerVolume}</div>
              <button
                className={styles.volumeButton}
                onClick={() => setSamplerVolume(Math.min(50, samplerVolume + 5))}
                disabled={samplerAnimating}
              >
                <Plus size={24} />
              </button>
            </div>
          </div>

          <button
            className={`${styles.startButton} ${samplerAnimating ? styles.animating : ""}`}
            onClick={handleSampler}
            disabled={samplerAnimating}
          >
            <Droplet size={48} className={samplerAnimating ? styles.pulse : ""} />
            <span>{samplerAnimating ? "Pouring Sample..." : "Start Sampler"}</span>
          </button>

          {samplerAnimating && (
            <div className={styles.progressIndicator}>
              <div className={styles.progressBar}></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Cleaning View
  if (view === "cleaning") {
    return (
      <div className={styles.serviceScreen}>
        <div className={styles.subHeader}>
          <button className={styles.backButton} onClick={handleBack}>
            <ArrowLeft size={24} />
            <span>Back</span>
          </button>
          <h2 className={styles.subTitle}>Cleaning Mode</h2>
        </div>

        <div className={styles.cleaningContent}>
          {cleaningPhase === null ? (
            <button className={styles.startButton} onClick={startCleaningSequence}>
              <Sparkles size={48} />
              <span>Start Cleaning</span>
            </button>
          ) : cleaningPhase === "completed" ? (
            <div className={styles.completedMessage}>
              <CheckCircle size={64} className={styles.completedIcon} />
              <h3>Cleaning Completed!</h3>
              <p>The machine has been cleaned successfully.</p>
              <button className={styles.primaryButton} onClick={completeCleaning}>
                Back to Cleaning Menu
              </button>
            </div>
          ) : (
            <>
              <div className={styles.cleaningProcess}>
                <div className={styles.phaseIndicator}>
                  <div
                    className={`${styles.phase} ${
                      cleaningPhase === "chemical"
                        ? styles.active
                        : ["waiting", "water"].includes(cleaningPhase)
                          ? styles.completed
                          : ""
                    }`}
                  >
                    <div className={styles.phaseNumber}>1</div>
                    <div className={styles.phaseName}>Chemical Cleaning</div>
                    {cleaningPhase === "chemical" && !cleaningPaused && <div className={styles.phaseSpinner}></div>}
                  </div>

                  <div
                    className={`${styles.phase} ${
                      cleaningPhase === "waiting" ? styles.active : cleaningPhase === "water" ? styles.completed : ""
                    }`}
                  >
                    <div className={styles.phaseNumber}>2</div>
                    <div className={styles.phaseName}>Waiting</div>
                    {cleaningPhase === "waiting" && !cleaningPaused && <div className={styles.phaseSpinner}></div>}
                  </div>

                  <div className={`${styles.phase} ${cleaningPhase === "water" ? styles.active : ""}`}>
                    <div className={styles.phaseNumber}>3</div>
                    <div className={styles.phaseName}>Fresh Water Rinse</div>
                    {cleaningPhase === "water" && !cleaningPaused && <div className={styles.phaseSpinner}></div>}
                  </div>
                </div>
              </div>

              {cleaningPaused && <div className={styles.pausedIndicator}>PAUSED</div>}

              <div className={styles.cleaningControls}>
                {!cleaningPaused ? (
                  <button className={styles.pauseButton} onClick={pauseCleaning}>
                    <Pause size={24} />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button className={styles.resumeButton} onClick={resumeCleaning}>
                    <Droplet size={24} />
                    <span>Resume</span>
                  </button>
                )}
                <button className={styles.stopButton} onClick={stopCleaning}>
                  <X size={24} />
                  <span>Stop</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Settings Menu View
  if (view === "settings") {
    return (
      <div className={styles.serviceScreen}>
        <div className={styles.subHeader}>
          <button className={styles.backButton} onClick={handleBack}>
            <ArrowLeft size={24} />
            <span>Back</span>
          </button>
          <h2 className={styles.subTitle}>Settings</h2>
        </div>

        <div className={styles.settingsGrid}>
          <button className={styles.settingButton} onClick={() => navigateToView("change-pin", "settings")}>
            <Lock size={32} />
            <span>Change PIN</span>
          </button>

          <button className={styles.settingButton} onClick={() => navigateToView("language", "settings")}>
            <Languages size={32} />
            <span>Language</span>
          </button>

          <button className={styles.settingButton} onClick={() => navigateToView("api-settings", "settings")}>
            <Globe size={32} />
            <span>API Settings</span>
          </button>

          <button className={styles.settingButton} onClick={() => navigateToView("arduino-settings", "settings")}>
            <Cpu size={32} />
            <span>Arduino Settings</span>
          </button>

          <button className={styles.settingButton} onClick={() => navigateToView("interface-settings", "settings")}>
            <Palette size={32} />
            <span>Interface Settings</span>
          </button>

          <button className={styles.settingButton} onClick={() => navigateToView("payment-settings", "settings")}>
            <CreditCard size={32} />
            <span>Payment Settings</span>
          </button>

          <button className={styles.settingButton} onClick={() => navigateToView("log-file", "settings")}>
            <FileText size={32} />
            <span>Check Log File</span>
          </button>
        </div>
      </div>
    );
  }

  // Change PIN View
  if (view === "change-pin") {
    return (
      <div className={styles.serviceScreen}>
        <div className={styles.subHeader}>
          <button className={styles.backButton} onClick={handleBack}>
            <ArrowLeft size={24} />
            <span>Back</span>
          </button>
          <h2 className={styles.subTitle}>Change PIN</h2>
        </div>

        <div className={styles.formContent}>
          <div className={styles.formGroup}>
            <label>Current PIN</label>
            <input
              type="password"
              maxLength={4}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
              className={styles.input}
              placeholder="Enter current PIN"
            />
          </div>

          <div className={styles.formGroup}>
            <label>New PIN</label>
            <input
              type="password"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              className={styles.input}
              placeholder="Enter new 4-digit PIN"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Confirm New PIN</label>
            <input
              type="password"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              className={styles.input}
              placeholder="Confirm new PIN"
            />
          </div>

          {pinError && <div className={styles.error}>{pinError}</div>}

          <button className={styles.primaryButton} onClick={handleChangePIN}>
            <Save size={24} />
            <span>Save New PIN</span>
          </button>
        </div>
      </div>
    );
  }

  // Language View
  if (view === "language") {
    return (
      <div className={styles.serviceScreen}>
        <div className={styles.subHeader}>
          <button className={styles.backButton} onClick={handleBack}>
            <ArrowLeft size={24} />
            <span>Back</span>
          </button>
          <h2 className={styles.subTitle}>Language / Мова</h2>
        </div>

        <div className={styles.languageContent}>
          <button
            className={`${styles.languageButton} ${language === "en" ? styles.selected : ""}`}
            onClick={() => handleLanguageChange("en")}
          >
            <span className={styles.flag}>🇬🇧</span>
            <span className={styles.languageName}>English</span>
            {language === "en" && <CheckCircle size={24} className={styles.checkmark} />}
          </button>

          <button
            className={`${styles.languageButton} ${language === "uk" ? styles.selected : ""}`}
            onClick={() => handleLanguageChange("uk")}
          >
            <span className={styles.flag}>🇺🇦</span>
            <span className={styles.languageName}>Українська</span>
            {language === "uk" && <CheckCircle size={24} className={styles.checkmark} />}
          </button>
        </div>
      </div>
    );
  }

  // API Settings View
  if (view === "api-settings") {
    return (
      <div className={styles.serviceScreen}>
        <div className={styles.subHeader}>
          <button className={styles.backButton} onClick={handleBack}>
            <ArrowLeft size={24} />
            <span>Back</span>
          </button>
          <h2 className={styles.subTitle}>API Settings</h2>
        </div>

        <div className={styles.formContent}>
          <div className={styles.formGroup}>
            <label>API Endpoint URL</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className={styles.input}
              placeholder="https://api.example.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label>API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className={styles.input}
              placeholder="Enter API key"
            />
          </div>

          <button className={styles.primaryButton} onClick={handleSaveApiSettings}>
            <Save size={24} />
            <span>Save API Settings</span>
          </button>
        </div>
      </div>
    );
  }

  // Arduino Settings handlers
  const handleSaveArduinoSettings = () => {
    localStorage.setItem('arduinoCoeff', coeff.toString());
    localStorage.setItem('arduinoPower', power.toString());
    localStorage.setItem('arduinoVolume', volume.toString());
    localStorage.setItem('arduinoWaiting', waiting.toString());
    localStorage.setItem('arduinoDisplayEnabled', displayEnabled.toString());
    addLog('settings', 'Arduino settings updated');
    setView('settings');
  };

  const handleCalibration = () => {
    setCalibrationDialogOpen(true);
    setCountedImpulses(null);
    setRealVolume(0);
    setCalibrationStarted(false);
    addLog('settings', 'Calibration dialog opened');
  };
  
  const handleStartCalibration = () => {
    setCalibrationStarted(true);
    // Simulate Arduino counting impulses - in real implementation this will come from Arduino
    setTimeout(() => {
      setCountedImpulses(250); // Example value
      addLog('settings', 'Calibration completed: 250 impulses counted');
    }, 2000);
  };
  
  const handleSaveCalibration = () => {
    if (countedImpulses && realVolume > 0) {
      const newCoeff = countedImpulses / realVolume;
      setCoeff(parseFloat(newCoeff.toFixed(2)));
      localStorage.setItem('arduinoCoeff', newCoeff.toFixed(2));
      addLog('settings', `Calibration saved: coeff = ${newCoeff.toFixed(2)} (${countedImpulses} impulses / ${realVolume} ml)`);
      setCalibrationDialogOpen(false);
    }
  };

  const handleTest = () => {
    addLog('settings', `Power test started at ${power}%`);
  };
  
  const handlePowerChange = (delta: number) => {
    setPower(prev => Math.min(100, Math.max(30, prev + delta)));
  };

  const handleConnectionSettings = () => {
    setConnectionDialogOpen(true);
    arduino.scanPorts(); // Scan when opening dialog
    addLog('settings', 'Connection settings dialog opened');
  };
  
  const handleConnectToDevice = async (port: any) => {
    try {
      await arduino.connectToPort(port);
      addLog('settings', 'Connected to Arduino device');
      setConnectionDialogOpen(false);
    } catch (err) {
      addLog('error', `Failed to connect: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  const handleRequestNewPort = async () => {
    try {
      await arduino.connect(); // This will show the browser's device picker
      addLog('settings', 'New Arduino device connected');
      setConnectionDialogOpen(false);
    } catch (err) {
      addLog('error', `Failed to connect: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpdateFirmware = () => {
    addLog('settings', 'Firmware update initiated');
  };

  const handleResetArduino = () => {
    if (confirm('Are you sure you want to reset Arduino settings to defaults?')) {
      setCoeff(2.02);
      setPower(60);
      setVolume(3.0);
      setWaiting(3);
      setDisplayEnabled(true);
      addLog('settings', 'Arduino settings reset to defaults');
    }
  };

  // Arduino Settings View
  if (view === "arduino-settings") {

    return (
      <div className={styles.serviceScreen}>
        <div className={styles.arduinoHeader}>
          <button className={styles.backButton} onClick={handleBack}>
            <ArrowLeft size={24} />
            <span>Back</span>
          </button>
          <button className={styles.saveButton} onClick={handleSaveArduinoSettings}>
            <Save size={24} />
            <span>Save</span>
          </button>
        </div>

        <div className={styles.arduinoContent}>
          <div className={styles.statusIndicator}>
            <span className={`${styles.statusDot} ${connectionStatus === 'online' ? styles.online : styles.offline}`} />
            <span className={styles.statusText}>{connectionStatus === 'online' ? 'Online' : 'Offline'}</span>
          </div>

          <button className={styles.connectionButton} onClick={handleConnectionSettings}>
            Connection settings
          </button>

          <h2 className={styles.parametersTitle}>Parameters</h2>

          <div className={styles.paramGroup}>
            <label className={styles.paramLabel}>Coeff:</label>
            <div className={styles.paramRow}>
              <input
                type="number"
                step="0.01"
                value={coeff}
                onChange={(e) => setCoeff(parseFloat(e.target.value) || 0)}
                className={styles.paramInput}
              />
              <button className={styles.calibrationButton} onClick={handleCalibration}>
                Calibration
              </button>
            </div>
          </div>

          <div className={styles.paramGroup}>
            <label className={styles.paramLabel}>Power:</label>
            <div className={styles.paramRow}>
              <div className={styles.powerControl}>
                <button className={styles.powerButton} onClick={() => handlePowerChange(-1)}>
                  <Minus size={20} />
                </button>
                <div className={styles.powerValue}>{power}%</div>
                <button className={styles.powerButton} onClick={() => handlePowerChange(1)}>
                  <Plus size={20} />
                </button>
              </div>
              <button className={styles.testButton} onClick={handleTest}>
                Test
              </button>
            </div>
          </div>

          <div className={styles.paramGroupRow}>
            <div className={styles.paramGroupSmall}>
              <label className={styles.paramLabel}>Volume:</label>
              <div className={styles.paramInputWrapper}>
                <input
                  type="number"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value) || 0)}
                  className={styles.paramInputSmall}
                />
                <span className={styles.paramUnit}>L</span>
              </div>
            </div>

            <div className={styles.paramGroupSmall}>
              <label className={styles.paramLabel}>Waiting:</label>
              <div className={styles.paramInputWrapper}>
                <input
                  type="number"
                  value={waiting}
                  onChange={(e) => setWaiting(parseInt(e.target.value) || 0)}
                  className={styles.paramInputSmall}
                />
                <span className={styles.paramUnit}>sec</span>
              </div>
            </div>
          </div>

          <label className={styles.displayToggle}>
            <input
              type="checkbox"
              checked={displayEnabled}
              onChange={(e) => setDisplayEnabled(e.target.checked)}
              className={styles.checkbox}
            />
            <span>Display</span>
          </label>

          <button className={styles.updateButton} onClick={handleUpdateFirmware}>
            Update firmware
          </button>

          <div className={styles.firmwareInfo}>
            <p className={styles.firmwareText}>Current version: {firmwareVersion}</p>
            <p className={styles.firmwareText}>Last update: {lastUpdate}</p>
          </div>

          <button className={styles.resetButton} onClick={handleResetArduino}>
            Reset
          </button>
        </div>
        
        {/* Calibration Dialog */}
        {calibrationDialogOpen && (
          <div className={styles.dialogOverlay} onClick={() => setCalibrationDialogOpen(false)}>
            <div className={styles.dialogBox} onClick={(e) => e.stopPropagation()}>
              <div className={styles.dialogHeader}>
                <h3>Calibration</h3>
                <button className={styles.closeButton} onClick={() => setCalibrationDialogOpen(false)}>
                  <X size={24} />
                </button>
              </div>
              
              <div className={styles.dialogContent}>
                {!calibrationStarted ? (
                  <button className={styles.primaryButton} onClick={handleStartCalibration}>
                    Start Calibration
                  </button>
                ) : (
                  <>
                    <div className={styles.formGroup}>
                      <label>Counted Impulses</label>
                      <input
                        type="text"
                        value={countedImpulses !== null ? countedImpulses : 'Counting...'}
                        readOnly
                        className={styles.input}
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>Real Volume (ml)</label>
                      <div className={styles.volumeInput}>
                        <button
                          className={styles.volumeButton}
                          onClick={() => setRealVolume(Math.max(0, realVolume - 1))}
                          disabled={!countedImpulses}
                        >
                          <Minus size={20} />
                        </button>
                        <input
                          type="number"
                          step="1"
                          value={realVolume}
                          onChange={(e) => setRealVolume(parseInt(e.target.value) || 0)}
                          className={styles.input}
                          disabled={!countedImpulses}
                        />
                        <button
                          className={styles.volumeButton}
                          onClick={() => setRealVolume(realVolume + 1)}
                          disabled={!countedImpulses}
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                    
                    {countedImpulses && realVolume > 0 && (
                      <div className={styles.calculatedCoeff}>
                        New coefficient: {(countedImpulses / realVolume).toFixed(2)}
                      </div>
                    )}
                    
                    <button 
                      className={styles.primaryButton} 
                      onClick={handleSaveCalibration}
                      disabled={!countedImpulses || realVolume <= 0}
                    >
                      <Save size={24} />
                      <span>Save</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Connection Settings Dialog */}
        {connectionDialogOpen && (
          <div className={styles.dialogOverlay} onClick={() => setConnectionDialogOpen(false)}>
            <div className={styles.dialogBox} onClick={(e) => e.stopPropagation()}>
              <div className={styles.dialogHeader}>
                <h3>Connection Settings</h3>
                <button className={styles.closeButton} onClick={() => setConnectionDialogOpen(false)}>
                  <X size={24} />
                </button>
              </div>
              
              <div className={styles.dialogContent}>
                <div className={styles.formGroup}>
                  <div className={styles.deviceListHeader}>
                    <label>Available Devices</label>
                    <button 
                      className={styles.refreshButton} 
                      onClick={arduino.scanPorts}
                      title="Scan for devices"
                    >
                      <RefreshCw size={18} />
                    </button>
                  </div>
                  
                  {!arduino.isSupported ? (
                    <div className={styles.warningMessage}>
                      Web Serial API is not supported in this browser. Please use Chrome, Edge, or Opera.
                    </div>
                  ) : arduino.error ? (
                    <div className={styles.errorMessage}>
                      {arduino.error}
                    </div>
                  ) : arduino.availablePorts.length === 0 ? (
                    <div className={styles.emptyDeviceList}>
                      <Cpu size={32} className={styles.emptyIcon} />
                      <p>No serial devices found</p>
                      <p className={styles.emptyHint}>Connect your Arduino via USB and click refresh</p>
                    </div>
                  ) : (
                    <div className={styles.deviceList}>
                      {arduino.availablePorts.map((portInfo) => (
                        <div key={portInfo.id} className={styles.deviceItem}>
                          <Cpu size={20} />
                          <span>{portInfo.name}</span>
                          <button 
                            className={styles.connectButton}
                            onClick={() => handleConnectToDevice(portInfo.port)}
                          >
                            Connect
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <button 
                  className={styles.primaryButton} 
                  onClick={handleRequestNewPort}
                  disabled={!arduino.isSupported}
                >
                  <Plus size={20} />
                  <span>Add New Device</span>
                </button>
                
                <p className={styles.infoText}>
                  {arduino.availablePorts.length > 0 
                    ? 'Select a device from the list above or add a new device to establish connection with Arduino.'
                    : 'Click "Add New Device" to select your Arduino from the browser\'s device picker.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Interface Settings View
  if (view === "interface-settings") {
    const enabledPortions = [
      interfaceSettings.enableSmall,
      interfaceSettings.enableMedium,
      interfaceSettings.enableLarge,
    ].filter(Boolean).length;

    return (
      <div className={styles.serviceScreen}>
        <div className={styles.subHeader}>
          <button className={styles.backButton} onClick={handleBack}>
            <ArrowLeft size={24} />
            <span>Back</span>
          </button>
          <h2 className={styles.subTitle}>Interface Settings</h2>
        </div>

        <div className={styles.formContent}>
          <div className={styles.formGroup}>
            <label>Coffee Name</label>
            <input
              type="text"
              value={interfaceSettings.name}
              onChange={(e) => setInterfaceSettings({ ...interfaceSettings, name: e.target.value })}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              value={interfaceSettings.description}
              onChange={(e) => setInterfaceSettings({ ...interfaceSettings, description: e.target.value })}
              className={styles.textarea}
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Image URL</label>
            <input
              type="text"
              value={interfaceSettings.imageUrl}
              onChange={(e) => setInterfaceSettings({ ...interfaceSettings, imageUrl: e.target.value })}
              className={styles.input}
            />
          </div>

          <div className={styles.portionSection}>
            <h3 className={styles.sectionTitle}>Small Portion</h3>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={interfaceSettings.enableSmall}
                onChange={(e) => setInterfaceSettings({ ...interfaceSettings, enableSmall: e.target.checked })}
                className={styles.checkbox}
                disabled={enabledPortions === 1 && interfaceSettings.enableSmall}
              />
              <span>Enable Small Portion</span>
            </label>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Price ($)</label>
                <input
                  type="number"
                  step="0.10"
                  value={interfaceSettings.priceSmall}
                  onChange={(e) =>
                    setInterfaceSettings({ ...interfaceSettings, priceSmall: parseFloat(e.target.value) || 0 })
                  }
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Amount (ml)</label>
                <input
                  type="number"
                  value={interfaceSettings.amountSmall}
                  onChange={(e) =>
                    setInterfaceSettings({ ...interfaceSettings, amountSmall: parseInt(e.target.value) || 0 })
                  }
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.portionSection}>
            <h3 className={styles.sectionTitle}>Medium Portion</h3>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={interfaceSettings.enableMedium}
                onChange={(e) => setInterfaceSettings({ ...interfaceSettings, enableMedium: e.target.checked })}
                className={styles.checkbox}
                disabled={enabledPortions === 1 && interfaceSettings.enableMedium}
              />
              <span>Enable Medium Portion</span>
            </label>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Price ($)</label>
                <input
                  type="number"
                  step="0.10"
                  value={interfaceSettings.priceMedium}
                  onChange={(e) =>
                    setInterfaceSettings({ ...interfaceSettings, priceMedium: parseFloat(e.target.value) || 0 })
                  }
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Amount (ml)</label>
                <input
                  type="number"
                  value={interfaceSettings.amountMedium}
                  onChange={(e) =>
                    setInterfaceSettings({ ...interfaceSettings, amountMedium: parseInt(e.target.value) || 0 })
                  }
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.portionSection}>
            <h3 className={styles.sectionTitle}>Large Portion</h3>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={interfaceSettings.enableLarge}
                onChange={(e) => setInterfaceSettings({ ...interfaceSettings, enableLarge: e.target.checked })}
                className={styles.checkbox}
                disabled={enabledPortions === 1 && interfaceSettings.enableLarge}
              />
              <span>Enable Large Portion</span>
            </label>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Price ($)</label>
                <input
                  type="number"
                  step="0.10"
                  value={interfaceSettings.priceLarge}
                  onChange={(e) =>
                    setInterfaceSettings({ ...interfaceSettings, priceLarge: parseFloat(e.target.value) || 0 })
                  }
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Amount (ml)</label>
                <input
                  type="number"
                  value={interfaceSettings.amountLarge}
                  onChange={(e) =>
                    setInterfaceSettings({ ...interfaceSettings, amountLarge: parseInt(e.target.value) || 0 })
                  }
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.infoBox}>
            <p>
              <strong>Note:</strong> If a portion price is set to $0, the payment screen will be skipped for that
              portion.
            </p>
            <p>At least one portion must be enabled at all times.</p>
          </div>

          <button className={styles.primaryButton} onClick={handleSaveInterfaceSettings}>
            <Save size={24} />
            <span>Save Interface Settings</span>
          </button>
        </div>
      </div>
    );
  }

  // Payment Settings View
  if (view === "payment-settings") {
    return (
      <div className={styles.serviceScreen}>
        <div className={styles.subHeader}>
          <button className={styles.backButton} onClick={handleBack}>
            <ArrowLeft size={24} />
            <span>Back</span>
          </button>
          <h2 className={styles.subTitle}>Payment Settings</h2>
        </div>

        <div className={styles.formContent}>
          <div className={styles.toggleGroup}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={paymentSettings.nfcEnabled}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, nfcEnabled: e.target.checked })}
                className={styles.checkbox}
              />
              <span>Enable NFC Payment</span>
            </label>

            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={paymentSettings.qrEnabled}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, qrEnabled: e.target.checked })}
                className={styles.checkbox}
              />
              <span>Enable QR Payment</span>
            </label>

            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={paymentSettings.noPaymentMode}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, noPaymentMode: e.target.checked })}
                className={styles.checkbox}
              />
              <span>Enable Mode Without Payments</span>
            </label>
          </div>

          <div className={styles.formGroup}>
            <label>Merchant ID</label>
            <input
              type="text"
              value={paymentSettings.merchantId}
              onChange={(e) => setPaymentSettings({ ...paymentSettings, merchantId: e.target.value })}
              className={styles.input}
              placeholder="Enter merchant ID"
            />
          </div>

          <div className={styles.infoBox}>
            <p>
              <strong>Note:</strong> When "Mode Without Payments" is enabled, the payment screen will be completely
              skipped.
            </p>
          </div>

          <button className={styles.primaryButton} onClick={handleSavePaymentSettings}>
            <Save size={24} />
            <span>Save Payment Settings</span>
          </button>
        </div>
      </div>
    );
  }

  // Log File View
  if (view === "log-file") {
    return (
      <div className={styles.serviceScreen}>
        <div className={styles.subHeader}>
          <button className={styles.backButton} onClick={handleBack}>
            <ArrowLeft size={24} />
            <span>Back</span>
          </button>
          <h2 className={styles.subTitle}>System Logs</h2>
        </div>

        <div className={styles.logContent}>
          <div className={styles.filterBar}>
            <Filter size={20} />
            <select
              className={styles.filterSelect}
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value as LogEntry["type"] | "all")}
            >
              <option value="all">All Logs</option>
              <option value="transaction">Transactions</option>
              <option value="pouring">Pourings</option>
              <option value="settings">Settings</option>
              <option value="cleaning">Cleaning</option>
              <option value="error">Errors</option>
            </select>
          </div>

          {filteredLogs.length === 0 ? (
            <div className={styles.emptyLog}>
              <FileText size={48} />
              <p>{logFilter === "all" ? "No logs available" : `No ${logFilter} logs available`}</p>
            </div>
          ) : (
            <div className={styles.logList}>
              {filteredLogs.map((log) => (
                <div key={log.id} className={`${styles.logEntry} ${styles[log.type]}`}>
                  <div className={styles.logHeader}>
                    <span className={styles.logType}>{log.type.toUpperCase()}</span>
                    <span className={styles.logTime}>
                      {log.timestamp.toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className={styles.logMessage}>{log.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main Service Menu
  return (
    <div className={styles.serviceScreen}>
      <div className={styles.header}>
        <h1 className={styles.title}>Service Menu</h1>
      </div>

      <div className={styles.buttonGrid}>
        <button className={styles.serviceButton} onClick={() => setView("sampler")}>
          <div className={styles.buttonContent}>
            <Droplet size={48} />
            <span>Sampler</span>
          </div>
          <div className={styles.volumeBadge}>{samplerVolume} ml</div>
        </button>

        <button className={styles.serviceButton} onClick={() => setView("settings")}>
          <Settings size={48} />
          <span>Settings</span>
        </button>

        <button className={styles.serviceButton} onClick={() => setView("cleaning")}>
          <Sparkles size={48} />
          <span>Cleaning</span>
        </button>

        <button
          className={`${styles.serviceButton} ${styles.maintenanceButton} ${maintenanceMode ? styles.active : ""}`}
          onClick={toggleMaintenanceMode}
        >
          <PowerOff size={48} />
          <span>Maintenance Mode</span>
          <div className={styles.toggleIndicator}>{maintenanceMode ? "ON" : "OFF"}</div>
        </button>
      </div>

      <button className={styles.backButton} onClick={handleBack}>
        <ArrowLeft size={24} />
        <span>Back to Main</span>
      </button>
    </div>
  );
}
