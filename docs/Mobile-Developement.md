# QuantMind Mobile Development Guide

This guide provides everything you need to set up, run, and build the QuantMind mobile application (`apps/mobile`).

---

## 1. Prerequisites

### Universal
- **Node.js**: v18+ (LTS recommended)
- **Watchman**: (macOS only) `brew install watchman`

### Android (Windows & macOS)
- **Java Development Kit (JDK)**: JDK 17 or 21 (v23+ may require additional config).
- **Android Studio**: Install and configure the following in SDK Manager:
  - Android SDK Platform 34 or 35.
  - Android SDK Build-Tools.
  - Android SDK Platform-Tools.
  - **Android SDK Command-line Tools (latest)**.
  - Intel x86 Emulator Accelerator (HAXM) or Google Play Intel x86 Atom System Image.

### iOS (macOS Only)
- **Xcode**: Latest stable version from App Store.
- **Xcode Command Line Tools**: `xcode-select --install`.
- **CocoaPods**: `sudo gem install cocoapods` or `brew install cocoapods`.

---

## 2. Environment Variables

### Windows
Set these in "Edit the system environment variables" -> "Environment Variables" -> "User variables":

| Variable | Value |
| :--- | :--- |
| `ANDROID_HOME` | `C:\Users\<YourUser>\AppData\Local\Android\Sdk` |
| `ANDROID_SDK_ROOT` | `C:\Users\<YourUser>\AppData\Local\Android\Sdk` |

Add to `Path`:
- `%ANDROID_HOME%\platform-tools`
- `%ANDROID_HOME%\emulator`
- `%ANDROID_HOME%\cmdline-tools\latest\bin`

### macOS/Linux
Add to `~/.zshrc` or `~/.bash_profile`:

```bash
export ANDROID_HOME=$HOME/Library/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

---

## 3. Running the App

### Start Development Server
From the project root:
```bash
npm run dev --filter=quantmind
```
Or from `apps/mobile`:
```bash
npx expo start
```

### Run on Android Emulator
1. Open Android Studio -> Device Manager -> Start your Virtual Device (Pixel series recommended).
2. Run:
   ```bash
   npx expo run:android
   ```

### Run on iOS Simulator (macOS Only)
1. Ensure Xcode is installed and the simulator is booted (`open -a Simulator`).
2. Run:
   ```bash
   npx expo run:ios
   ```

### Run on Physical Device
1. **Android**: Enable **USB Debugging** in Developer Options. Connect via USB or use `adb connect <IP>:5555` for wireless debugging.
2. **iOS**: Connect via USB. Ensure your Apple ID is added to Xcode and the device is "Trusted".
3. Run `npx expo run:android` or `npx expo run:ios --device`.

---

## 4. Building for Production

We use **EAS (Expo Application Services)** for production-ready builds.

### Login to Expo
```bash
npx eas login
```

### Build Android (.apk or .aab)
- **AAB (for Google Play)**:
  ```bash
  npx eas build --platform android --profile production
  ```
- **APK (for testing)**:
  Make sure you have a `preview` profile in `eas.json` with `buildType: "apk"`.
  ```bash
  npx eas build --platform android --profile preview
  ```

### Build iOS (.ipa)
- **App Store**:
  ```bash
  npx eas build --platform ios --profile production
  ```
- **Ad-hoc (for internal testing)**:
  ```bash
  npx eas build --platform ios --profile preview
  ```

---

## 5. Verification Checklist

- [ ] `java -version` returns JDK 17/21.
- [ ] `adb devices` lists your emulator or physical device.
- [ ] `npx react-native doctor` shows all Android/iOS requirements met.
- [ ] `.env` file in `apps/mobile` is populated correctly.

---

## 6. Troubleshooting & Optimizations

- **Gradle Error**: Run `cd android && ./gradlew clean` (macOS) or `gradlew clean` (Windows).
- **Stuck Metro Bundler**: Run `npx expo start --clear`.
- **Emulator Performance**: Ensure "Graphics" is set to "Hardware - GLES 2.0" in AVD settings.
- **Physical Device Not Detected**: Check USB cable, ensure OEM Unlocking is ON (Android), or check Xcode "Devices and Simulators" (iOS).

---

## 8. Integrated Development Environment (VS Code)

For the best experience, we recommend using **VS Code** with the following extensions:

- **Expo Tools**: For `app.json` autocompletion and manifest verification.
- **ESLint & Prettier**: For code quality and consistent formatting.
- **React Native Tools**: For debugging from within VS Code.
- **TypeScript Vue Plugin**: (Optional) if using specific workspace features.
- **Tailwind CSS IntelliSense**: For NativeWind support.

### Fast Refresh
Ensure "Fast Refresh" is enabled in the Expo menu (Shake device or `Cmd+D`/`Ctrl+M` in emulator) to see changes instantly without rebuilding.

---

