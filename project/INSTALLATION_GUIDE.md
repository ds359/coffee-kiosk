# Coffee Kiosk - Android Tablet Installation Guide

## Method 1: Install as Progressive Web App (PWA) - RECOMMENDED ✅

This is the easiest and fastest method. No app store needed!

### Steps:

1. **Deploy Your Application**
   - Upload your application to a web server (hosting service like Vercel, Netlify, or your own server)
   - Make sure it's accessible via HTTPS (required for PWA)
   - Example URL: `https://your-coffee-kiosk.com`

2. **On Your Android Tablet:**
   - Open **Google Chrome** browser
   - Navigate to your application URL
   - Tap the **three-dot menu** (⋮) in the top-right corner
   - Select **"Install app"** or **"Add to Home Screen"**
   - Confirm the installation
   - The app icon will appear on your home screen

3. **Launch the App:**
   - Tap the icon on your home screen
   - The app will open in fullscreen mode (no browser UI)
   - Works offline after first load
   - Feels like a native Android app

### Benefits:
- ✅ No coding or building required
- ✅ Instant updates (just refresh the page)
- ✅ Works offline
- ✅ Fullscreen kiosk mode
- ✅ No app store approval needed

---

## Method 2: Build as Android APK (Advanced)

If you need a real Android APK file, you'll need to use a framework like **Capacitor** or **Cordova**.

### Steps to Create APK:

1. **Install Capacitor:**
   ```bash
   npm install @capacitor/core @capacitor/cli
   npm install @capacitor/android
   npx cap init
   ```

2. **Configure Capacitor:**
   Edit `capacitor.config.json`:
   ```json
   {
     "appId": "com.coffeekiosk.app",
     "appName": "Coffee Kiosk",
     "webDir": "build",
     "bundledWebRuntime": false
   }
   ```

3. **Build Your App:**
   ```bash
   npm run build
   npx cap add android
   npx cap sync
   ```

4. **Open in Android Studio:**
   ```bash
   npx cap open android
   ```

5. **Build APK in Android Studio:**
   - Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - Wait for build to complete
   - Click "locate" to find your APK file
   - Transfer APK to your tablet and install

### Requirements:
- Android Studio installed
- Java Development Kit (JDK) 11 or higher
- More technical knowledge required

---

## Method 3: Use Your Tablet as Kiosk (Simplest for Testing)

If you just want to test locally:

1. **On your computer:**
   ```bash
   npm run dev
   ```
   - Note the local network IP (e.g., `http://192.168.1.100:5173`)

2. **On your Android tablet:**
   - Connect to the same WiFi network
   - Open Chrome browser
   - Visit the IP address from step 1
   - Use Chrome's kiosk mode or install as PWA (Method 1)

---

## Recommended Setup for Production Kiosk:

1. **Deploy to Web Hosting** (Vercel, Netlify, etc.)
2. **Install as PWA** on tablet (Method 1)
3. **Enable Kiosk Mode:**
   - Install a kiosk browser app from Play Store:
     - "Fully Kiosk Browser"
     - "Kiosk Browser Lockdown"
     - "SureLock Kiosk Lockdown"
   - Configure to auto-start your PWA in fullscreen
   - Disable home button, back button, etc.

4. **Security Settings:**
   - Disable app installation from unknown sources
   - Set up admin password
   - Auto-restart app on crash
   - Disable notifications

---

## Icons Required:

Before deploying, replace these placeholder files with actual icons:

- `/public/icon-192.png` - 192x192 pixels PNG
- `/public/icon-512.png` - 512x512 pixels PNG

You can create icons using:
- [Favicon Generator](https://favicon.io/)
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- Any image editor (Photoshop, GIMP, Canva)

Tip: Use a coffee cup icon or your brand logo!

---

## Testing PWA Features:

After installation, verify:
- ✅ App opens in fullscreen
- ✅ No browser address bar visible
- ✅ App works offline
- ✅ App icon on home screen looks good
- ✅ Portrait orientation locks correctly

---

## Support:

For best results, I recommend **Method 1 (PWA)** because:
- It's the simplest
- No compilation needed
- Easy to update (just upload new files)
- Works perfectly for kiosk applications
- No app store approval process

The PWA manifest and service worker have already been added to your project!
