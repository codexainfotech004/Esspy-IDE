# BharatBlocks IDE

A fully offline, drag-and-drop block programming IDE for ESP32 and Arduino Uno with Marathi language support. Built with Google Blockly, HTML/CSS/JS, Python Flask, and Electron.

---

## Features

| Feature | Description |
|---------|-------------|
| Block Programming | Drag-and-drop visual programming with Google Blockly |
| ESP32 + Arduino Uno | Code generation and upload for both boards |
| Real-Time Code Gen | Instant Arduino C++ and MicroPython code as you drag blocks |
| AI Studio | Camera object recognition, hand gestures, body pose, face detection, speech recognition |
| Marathi Support | Full Marathi (मराठी) translation for UI and blocks |
| Serial Monitor | Built-in serial monitor with SSE streaming |
| Project Management | Save/Load as `.bbp` JSON files |
| Dark Theme | Professional modern dark UI |
| Fully Offline | No internet required after initial load |
| Cross-Platform | Windows, macOS, Linux (Electron desktop app) |

---

## Project Structure

```
bharatblocks/
├── index.html                 # Main HTML entry point
├── style.css                  # All CSS styles (dark theme)
├── script.js                  # Main application logic
├── package.json               # Electron & npm config
├── README.md                  # This file
│
├── blocks/
│   └── custom_blocks.js       # Custom Blockly block definitions
│
├── generator/
│   ├── arduino_generator.js   # Arduino C++ code generator
│   └── micropython_generator.js # MicroPython code generator
│
├── ai/
│   ├── ai_studio.js           # AI Studio module
│   └── ai_blocks.js           # AI block definitions
│
├── backend/
│   ├── app.py                 # Python Flask server (port 5001)
│   └── requirements.txt       # Python dependencies
│
├── electron/
│   └── main.js                # Electron main process
│
├── projects/                  # Saved project files (.bbp)
├── firmware/                  # Pre-built firmware binaries
└── sketches/                  # Example Arduino sketches
```

---

## Tech Stack

**Frontend:** Google Blockly v11, HTML5, CSS3, JavaScript (ES6+), TensorFlow.js, MediaPipe, Web Speech API

**Backend:** Python 3.8+, Flask, Flask-CORS, Arduino CLI, PySerial

**Desktop:** Electron 30+, electron-builder

**Supported Boards:** ESP32 Dev Module (`esp32:esp32:esp32`), Arduino Uno R3 (`arduino:avr:uno`)

---

## Installation & Setup

### Prerequisites

- **Python 3.8+** — for backend/upload/serial features
- **Node.js 18+** — for Electron desktop app (optional, browser works without)
- **Arduino CLI** — for board upload (optional)

### Quick Start (Browser)

```bash
pip install -r backend/requirements.txt
python backend/app.py
```

Then open **http://127.0.0.1:5001** in your browser.

### With Electron Desktop App

```bash
npm install
npm start
```

### Arduino CLI Setup (for Upload)

```bash
arduino-cli core update-index
arduino-cli core install esp32:esp32
arduino-cli core install arduino:avr
```

---

## How to Run

| Method | Command |
|--------|---------|
| Browser only (no upload) | Open `index.html` directly |
| With backend | `python backend/app.py` → http://127.0.0.1:5001 |
| Desktop app | `npm start` |
| Windows one-click | Double-click `Run-App.bat` |

---

## Block Reference

| Category | Blocks |
|----------|--------|
| Control | Start Program, Delay, Run Once, Forever Loop, Repeat, While, For |
| GPIO | LED On/Off, Digital Write/Read, Analog Write/Read, Pin Mode |
| Buzzer | Buzzer On/Off, Play Tone, Musical Notes, Stop Tone |
| DC Motor | Motor Forward/Backward/Stop (port selection) |
| Servo | Servo Control, Sweep |
| Sensors | Ultrasonic (HC-SR04), IR Sensor, DHT Temp/Humidity |
| Display | LCD Setup, Print, Clear |
| Serial | Serial Print, Println |
| Logic | If/Else, Comparison, Boolean, AND/OR/NOT |
| Variables | Set/Get variable |
| Math | Arithmetic, Random, Functions |
| AI Events | When Class/Gesture/Pose/Face/Speech Detected |
| Relay | Relay On/Off/Toggle |
| WiFi | Connect/Disconnect, HTTP Get/Post |

---

## Serial Monitor

1. Connect your board via USB
2. Click the **Serial Monitor** button in the toolbar
3. Select the COM port and baud rate (9600 for Uno, 115200 for ESP32)
4. Click **Connect**

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + S | Save project |
| Ctrl/Cmd + O | Open project |
| Ctrl/Cmd + N | New project |
| F5 | Generate code |
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Shift + Z | Redo |
| Delete | Delete selected block |

---

## AI Studio

Open AI Studio from the toolbar for:

- **Camera AI** — Train custom object recognition with your webcam
- **Hand Gestures** — Detect Open Hand, Fist, Pointing, Thumb Up
- **Body Pose** — Detect Hands Raised, Arms Wide, Movement
- **Face Detection** — Detect head direction, smile
- **Speech Recognition** — Voice commands via browser Web Speech API

AI events can trigger block actions in your program.

---

## Hardware Connections (Arduino Uno)

| Component | Pins |
|-----------|------|
| LED | Anode → D8 (220Ω resistor), Cathode → GND |
| Active Buzzer | VCC → D9, GND → GND |
| DC Motor (L298N) | IN1 → D10, IN2 → D12, ENA → 5V (jumper), VCC → 12V ext, GND → common |
| Servo | Signal → D9, VCC → 5V, GND → GND |
| HC-SR04 | TRIG → D6, ECHO → D7, VCC → 5V, GND → GND |
| DHT11/22 | Data → D4, VCC → 5V, GND → GND |
| IR Sensor | OUT → D2, VCC → 5V, GND → GND |
| Soil Moisture | AO → A0, VCC → 5V, GND → GND |
| LCD I2C | SDA → A4, SCL → A5, VCC → 5V, GND → GND |

## Hardware Connections (ESP32)

| Component | Pins |
|-----------|------|
| LED | Anode → GPIO 2 (220Ω), Cathode → GND |
| Active Buzzer | VCC → GPIO 18, GND → GND |
| DC Motor (L298N) | IN1 → GPIO 25, IN2 → GPIO 26, ENA → 5V |
| HC-SR04 | TRIG → GPIO 5, ECHO → GPIO 18 |

---

## Building Desktop Apps

```bash
npm run build-win     # Windows (.exe)
npm run build-mac     # macOS (.dmg)
npm run build-linux   # Linux (.AppImage)
```

---

## License

MIT License — free to use, modify, and distribute.

Made in India
