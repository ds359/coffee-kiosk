import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { ArduinoController } from "~/components/arduino-controller";
import type { ArduinoMessage } from "~/hooks/use-arduino";
import styles from "./home.module.css";

export default function Home() {
  const navigate = useNavigate();
  const [coffeeImage, setCoffeeImage] = useState("");
  const [coffeeName, setCoffeeName] = useState("");
  const [coffeeDescription, setCoffeeDescription] = useState("");

  useEffect(() => {
    // Load settings from localStorage
    setCoffeeImage(
      localStorage.getItem("coffeeImage") || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop"
    );
    setCoffeeName(localStorage.getItem("coffeeName") || "Premium Espresso");
    setCoffeeDescription(localStorage.getItem("coffeeDescription") || "Fresh Coffee Made Just For You");
  }, []);

  const handleClick = () => {
    navigate("/selection");
  };

  const handleArduinoMessage = (message: ArduinoMessage) => {
    console.log('Arduino message received:', message);
    
    // Handle coin insertion
    if (message.type === 'coin') {
      const amount = parseFloat(message.data);
      console.log(`Coin inserted: ${amount}`);
      // Navigate to selection when money is inserted
      navigate("/selection");
    }
    
    // Handle button press
    if (message.type === 'button') {
      console.log(`Button pressed: ${message.data}`);
      // You can implement direct coffee selection here
    }
  };

  return (
    <>
      <ArduinoController onMessage={handleArduinoMessage} />
      <div className={styles.welcomeScreen} onClick={handleClick}>
      <div className={styles.welcomeContent}>
        <img src={coffeeImage} alt="Coffee" className={styles.welcomeImage} />
        <h1 className={styles.welcomeTitle}>Welcome</h1>
        <p className={styles.welcomeSubtitle}>{coffeeDescription}</p>
        <p className={styles.tapPrompt}>Tap to start</p>
      </div>
    </div>
    </>
  );
}
