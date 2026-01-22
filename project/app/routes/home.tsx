import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
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

  return (
    <div className={styles.welcomeScreen} onClick={handleClick}>
      <div className={styles.welcomeContent}>
        <img src={coffeeImage} alt="Coffee" className={styles.welcomeImage} />
        <h1 className={styles.welcomeTitle}>Welcome</h1>
        <p className={styles.welcomeSubtitle}>{coffeeDescription}</p>
        <p className={styles.tapPrompt}>Tap to start</p>
      </div>
    </div>
  );
}
