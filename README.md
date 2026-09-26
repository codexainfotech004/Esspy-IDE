# Arduino IDE - Block Coding

A clean, modern offline visual block programming environment tailored specifically for **Arduino** (Uno R3, Nano, Mega 2560). Built with Google Blockly, Vanilla HTML/CSS/JavaScript, Python Flask backend, and Electron.

---

## 🏛️ Architecture & System Design

```
                  ┌──────────────────────────────────────────┐
                  │       Electron Desktop Shell             │
                  │       (or Modern Web Browser)            │
                  └────────────────────┬─────────────────────┘
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│     Blockly UI Workspace      │             │     Live Arduino C++ Editor   │
│  (Custom AVR / Uno Blocks)    │──(Realtime)─│   (#include <Servo.h>, setup, │
│  • Digital/Analog I/O (D2-D13)│             │    loop, 9600 baud, etc.)     │
│  • Motor, Ultrasonic, Sensors │             └───────────────────────────────┘
│  • Loops, Math, Logic, Vars   │                             │
└───────────────┬───────────────┘                             │
                │                                             │
                │ (HTTP REST / SSE)                           │
                ▼                                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Flask Backend Server (Port 5001)                      │
│                                                                             │
│  • Board Auto-Detection: Serial ports & Arduino CLI boards                  │
│  • Compiler & Flasher: `arduino-cli compile` & `arduino-cli upload`         │
│  • Serial Monitor: Bi-directional SSE stream @ 9600 baud                    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼ (USB / COM Port)
                        ┌──────────────────────────────┐
                        │     Arduino Hardware Board   │
                        │    (Uno R3 / Nano / Mega)    │
                        └──────────────────────────────┘
```

---

## 📁 Project Structure

```
.
├── index.html                   # Clean, single-page IDE layout (Toolbar, Blockly, Arduino C++ Preview, Console)
├── style.css                    # Professional dark-theme IDE styling
├── script.js                    # Core application logic, Blockly workspace initialization, and upload pipeline
├── package.json                 # Electron desktop wrapper configuration
├── README.md                    # Project architecture and documentation
│
├── blocks/
│   └── custom_blocks.js         # Dedicated Arduino hardware blocks (Uno/AVR pinouts D2-D13, A0-A5, Servo, Motors)
│
├── generator/
│   └── arduino_generator.js     # Robust Arduino C++ code generator (setup(), loop(), pin modes, libraries)
│
├── backend/
│   ├── app.py                   # Lightweight Flask backend communicating with Arduino CLI & serial ports
│   └── requirements.txt         # Minimal Python dependencies (flask, flask-cors, pyserial)
│
├── electron/
│   └── main.js                  # Electron main window lifecycle and native menu
│
├── projects/                    # Saved visual block project files (.bbp)
└── sketches/                    # Temporary sketches generated during compilation
```

---

## ⚡ Features

- **Pure Arduino Block Coding:** Google Blockly environment mapped to real Arduino pins (Digital pins `D2`–`D13`, Analog pins `A0`–`A5`, standard Arduino Uno motor driver shield ports).
- **Real-Time Arduino C++ Generation:** Instant, syntax-highlighted Arduino C++ preview in the side panel as blocks are arranged.
- **One-Click Compile & Upload:** Direct integration with `arduino-cli` to compile sketches and flash them to connected Arduino boards.
- **Auto Port & Board Detection:** Automatically locates connected Arduino Uno, Nano, or Mega boards across available COM ports.
- **Integrated Serial Monitor:** Real-time bi-directional serial monitor with timestamping and configurable baud rates (default: `9600` baud).
- **Offline & Standalone:** Operates entirely locally without internet access or external cloud services.

---

## 🚀 Getting Started

### 1. Requirements
- **Python 3.8+** (for serial communication & Arduino CLI integration)
- **Node.js 18+** (optional, for Electron desktop runner)
- **Arduino CLI** (for compiling and flashing hardware)

### 2. Install Python Dependencies
```bash
pip install -r backend/requirements.txt
```

### 3. Run Backend & Frontend

#### Option A: Running in Browser
Start the local server:
```bash
python backend/app.py
```
Open **[http://localhost:5001](http://localhost:5001)** in your web browser.

#### Option B: Running as Electron Desktop App
```bash
npm install
npm start
```

---

## 🔌 Supported Arduino Boards

| Board | FQBN | Default Baud Rate |
|---|---|---|
| **Arduino Uno R3** (Recommended) | `arduino:avr:uno` | 9600 bps |
| **Arduino Nano** | `arduino:avr:nano` | 9600 bps |
| **Arduino Mega 2560** | `arduino:avr:mega` | 9600 bps |
