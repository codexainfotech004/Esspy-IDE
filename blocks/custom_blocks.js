/**
 * =============================================
 * BharatBlocks IDE - Professional Block Definitions
 * =============================================
 * 
 * Professional block-based programming interface for ESP32 and Arduino.
 * Clean, emoji-free design with clear, descriptive naming conventions.
 * 
 * Block Categories:
 *   - Control: Program flow, delays, loops
 *   - GPIO: Digital and analog I/O operations
 *   - Output: LED, Servo, Buzzer, Relay, DC Motor
 *   - Input: Sensors and input devices
 *   - Communication: Serial, WiFi
 *   - Display: LCD
 *   - Logic: Conditions, comparisons, boolean operations
 *   - Variables: Data storage and retrieval
 *   - Math: Numerical operations
 * 
 * Author: BharatBlocks Team
 * License: MIT
 * Version: 2.0 - Professional Edition
 */

// ==========================================
// Language translations for block labels
// ==========================================
const BLOCK_LANG = {
    en: {
        // Control Blocks
        start: "Program Start",
        delay: "Wait",
        delayMs: "ms",
        serialPrint: "Print to Serial",
        serialPrintMsg: "text",
        comment: "Comment",
        runOnce: "Run Once",
        breakLoop: "Break",
        continueLoop: "Continue",

        // GPIO Blocks
        ledOn: "Turn LED On",
        ledOff: "Turn LED Off",
        ledBlink: "Blink LED",
        pin: "GPIO Pin",
        digitalRead: "Read Digital",
        digitalWrite: "Write Digital",
        analogRead: "Read Analog",
        analogWrite: "Write Analog",
        value: "value",
        pinModeBlock: "Set Pin Mode",
        modeInput: "INPUT",
        modeOutput: "OUTPUT",
        high: "HIGH",
        low: "LOW",

        // Servo Blocks
        servoControl: "Set Servo Angle",
        servoSweep: "Sweep Servo",
        servoAttach: "Attach Servo",
        servoDetach: "Detach Servo",
        angle: "degrees",
        fromAngle: "from",
        toAngle: "to",
        speed: "delay",

        // Ultrasonic Sensor
        ultrasonicSetup: "Setup Ultrasonic",
        ultrasonicRead: "Read Distance",
        trigPin: "Trig",
        echoPin: "Echo",

        // IR Sensor
        irRead: "Read IR Sensor",
        irDetected: "IR Detected",
        irLineDetected: "Line Detected",

        // Buzzer Blocks
        buzzerOn: "Buzzer On",
        buzzerOff: "Buzzer Off",
        buzzerTone: "Play Frequency",
        buzzerMelody: "Play Note",
        frequency: "Hz",
        duration: "ms",
        note: "Note",

        // Relay Blocks
        relayOn: "Relay On",
        relayOff: "Relay Off",
        relayToggle: "Toggle Relay",

        // DC Motor Blocks
        motorForward: "Motor Forward",
        motorBackward: "Motor Backward",
        motorStop: "Motor Stop",
        motorSpeed: "PWM",
        pin1: "IN1",
        pin2: "IN2",
        enablePin: "EN",

        // DHT Sensor
        dhtSetup: "Setup DHT",
        dhtReadTemp: "Temperature",
        dhtReadHumidity: "Humidity",
        dhtHeatIndex: "Heat Index",
        dhtType: "Model",

        // Touch Sensor
        touchRead: "Read Touch",
        touchThreshold: "Touch Threshold",

        // LCD Display
        lcdSetup: "Initialize LCD",
        lcdPrint: "LCD Print",
        lcdClear: "Clear LCD",
        lcdSetCursor: "Set Cursor",
        row: "Row",
        col: "Col",
        address: "Address",

        // Soil Moisture
        soilRead: "Read Moisture",
        soilIsDry: "Soil Dry",
        soilThreshold: "Threshold",

        // Sound Sensor
        soundRead: "Read Sound",
        soundDetected: "Sound Detected",
        soundClapDetected: "Clap Detected",
        soundThreshold: "Threshold",

        // IR Receiver
        irRecvSetup: "Setup IR Receiver",
        irRecvCode: "Read IR Code",

        // Joystick
        joystickReadX: "Joystick X",
        joystickReadY: "Joystick Y",
        joystickButton: "Joystick Button",
        xPin: "X",
        yPin: "Y",
        btnPin: "Button",

        // Rotary Encoder
        encoderSetup: "Setup Encoder",
        encoderPosition: "Encoder Value",
        encoderButton: "Encoder Button",
        clkPin: "CLK",
        dtPin: "DT",
        swPin: "SW",

        // Push Button
        buttonPressed: "Button Pressed",
        buttonReleased: "Button Released",
        buttonLongPress: "Button Long Press",

        // WiFi
        wifiConnect: "Connect WiFi",
        wifiDisconnect: "Disconnect WiFi",
        wifiSSID: "Network",
        wifiPassword: "Password",
        wifiGetIP: "Get IP",
        wifiIsConnected: "WiFi Connected",
        wifiHTTPGet: "HTTP GET",
        wifiHTTPPost: "HTTP POST",
        wifiURL: "URL",
        wifiResponse: "Response",

        // Logic Blocks
        ifCondition: "If",
        then: "then",
        elseText: "else",
        repeatLoop: "Repeat",
        times: "times",
        whileLoop: "While",
        forLoop: "For",
        from: "from",
        to: "to",
        step: "step",
        foreverLoop: "Loop Forever",
        andOp: "and",
        orOp: "or",
        notOp: "not",

        // Comparison
        equals: "=",
        notEquals: "≠",
        lessThan: "<",
        greaterThan: ">",

        // Variables
        setVariable: "Set",
        to: "to",
        getVariable: "Get",

        // Math
        mathNumber: "Number",
        codeSnippet: "Custom Code",
        mathRandom: "Random",
        mathMin: "Min",
        mathMax: "Max",
        mathAbs: "Absolute",
        mathRound: "Round",
        mathFloor: "Floor",
        mathCeil: "Ceil",
        mathSqrt: "Square Root",
        mathPow: "Power",
        mathSin: "Sine",
        mathCos: "Cosine",
        mathTan: "Tangent",
    },
    mr: {
        // Control Blocks
        start: "कार्यक्रम सुरू करा",
        delay: "विलंब",
        delayMs: "मिलिसेकंद",
        serialPrint: "सिरियल प्रिंट",
        serialPrintMsg: "मजकूर",
        comment: "टिप्पणी",
        runOnce: "एकदा चालवा",
        breakLoop: "थांबा",
        continueLoop: "सुरू ठेवा",

        // GPIO Blocks
        ledOn: "LED चालू करा",
        ledOff: "LED बंद करा",
        ledBlink: "LED ब्लिंक",
        pin: "GPIO पिन",
        digitalRead: "डिजिटल वाचा",
        digitalWrite: "डिजिटल लिहा",
        analogRead: "ॲनालॉग वाचा",
        analogWrite: "ॲनालॉग लिहा",
        value: "मूल्य",
        pinModeBlock: "पिन मोड सेट करा",
        modeInput: "इनपुट",
        modeOutput: "आउटपुट",
        high: "हाय",
        low: "लो",

        // Servo Blocks
        servoControl: "सर्वो कोन सेट करा",
        servoSweep: "सर्वो स्वीप",
        servoAttach: "सर्वो जोडा",
        servoDetach: "सर्वो विलग करा",
        angle: "अंश",
        fromAngle: "पासून",
        toAngle: "पर्यंत",
        speed: "विलंब",

        // Ultrasonic Sensor
        ultrasonicSetup: "अल्ट्रासोनिक सेटअप",
        ultrasonicRead: "अंतर वाचा",
        trigPin: "ट्रिग",
        echoPin: "इको",

        // IR Sensor
        irRead: "IR वाचा",
        irDetected: "IR आढळला",
        irLineDetected: "रेषा आढळली",

        // Buzzer Blocks
        buzzerOn: "बझर चालू",
        buzzerOff: "बझर बंद",
        buzzerTone: "फ्रिक्वेन्सी",
        buzzerMelody: "स्वर",
        frequency: "Hz",
        duration: "ms",
        note: "स्वर",

        // Relay Blocks
        relayOn: "रिले चालू",
        relayOff: "रिले बंद",
        relayToggle: "रिले टॉगल",

        // DC Motor Blocks
        motorForward: "मोटर पुढे",
        motorBackward: "मोटर मागे",
        motorStop: "मोटर थांबा",
        motorSpeed: "PWM",
        pin1: "IN1",
        pin2: "IN2",
        enablePin: "EN",

        // DHT Sensor
        dhtSetup: "DHT सेटअप",
        dhtReadTemp: "तापमान",
        dhtReadHumidity: "आर्द्रता",
        dhtHeatIndex: "उष्णता निर्देशांक",
        dhtType: "मॉडेल",

        // Touch Sensor
        touchRead: "टच वाचा",
        touchThreshold: "टच थ्रेशोल्ड",

        // LCD Display
        lcdSetup: "LCD सेटअप",
        lcdPrint: "LCD प्रिंट",
        lcdClear: "LCD साफ करा",
        lcdSetCursor: "कर्सर सेट",
        row: "ओळ",
        col: "स्तंभ",
        address: "ॲड्रेस",

        // Soil Moisture
        soilRead: "ओलावा वाचा",
        soilIsDry: "माती कोरडी",
        soilThreshold: "थ्रेशोल्ड",

        // Sound Sensor
        soundRead: "ध्वनी वाचा",
        soundDetected: "ध्वनी आढळला",
        soundClapDetected: "ताळी आढळली",
        soundThreshold: "थ्रेशोल्ड",

        // IR Receiver
        irRecvSetup: "IR रिसीव्हर सेटअप",
        irRecvCode: "IR कोड वाचा",

        // Joystick
        joystickReadX: "जॉयस्टिक X",
        joystickReadY: "जॉयस्टिक Y",
        joystickButton: "जॉयस्टिक बटण",
        xPin: "X",
        yPin: "Y",
        btnPin: "बटण",

        // Rotary Encoder
        encoderSetup: "एनकोडर सेटअप",
        encoderPosition: "एनकोडर मूल्य",
        encoderButton: "एनकोडर बटण",
        clkPin: "CLK",
        dtPin: "DT",
        swPin: "SW",

        // Push Button
        buttonPressed: "बटण दाबले",
        buttonReleased: "बटण सोडले",
        buttonLongPress: "बटण जास्त वेळ दाबले",

        // WiFi
        wifiConnect: "WiFi जोडा",
        wifiDisconnect: "WiFi विलग करा",
        wifiSSID: "नेटवर्क",
        wifiPassword: "पासवर्ड",
        wifiGetIP: "IP मिळवा",
        wifiIsConnected: "WiFi जोडले",
        wifiHTTPGet: "HTTP GET",
        wifiHTTPPost: "HTTP POST",
        wifiURL: "URL",
        wifiResponse: "प्रतिसाद",

        // Logic Blocks
        ifCondition: "जर",
        then: "तर",
        elseText: "नाहीतर",
        repeatLoop: "पुन्हा करा",
        times: "वेळा",
        whileLoop: "जोपर्यंत",
        forLoop: "साठी",
        from: "पासून",
        to: "पर्यंत",
        step: "चरण",
        foreverLoop: "सतत चालवा",
        andOp: "आणि",
        orOp: "किंवा",
        notOp: "नाही",

        // Comparison
        equals: "=",
        notEquals: "≠",
        lessThan: "<",
        greaterThan: ">",

        // Variables
        setVariable: "सेट करा",
        to: "ला",
        getVariable: "मिळवा",

        // Math
        mathNumber: "संख्या",
        codeSnippet: "सानुकूल कोड",
        mathRandom: "यादृच्छिक",
        mathMin: "किमान",
        mathMax: "कमाल",
        mathAbs: "परिपूर्ण",
        mathRound: "गोल",
        mathFloor: "फर्श",
        mathCeil: "छपर",
        mathSqrt: "वर्गमूळ",
        mathPow: "घात",
        mathSin: "साइन",
        mathCos: "कोसाइन",
        mathTan: "टॅनजेंट",
    }
};

// Current language (default: English) - made global for script.js access
window.currentLang = 'en';
let currentLang = window.currentLang;

/**
 * Helper: get translation for current language
 * @param {string} key - Translation key
 * @returns {string} Translated text
 */
function t(key) {
    const lang = window.currentLang || 'en';
    return BLOCK_LANG[lang][key] || BLOCK_LANG['en'][key] || key;
}

// ==========================================
// Professional Color Palette (HSV hue values)
// These colors match the sidebar category colors from script.js
// ==========================================
const COLORS = {
    // Control Blocks - Blue Gray
    start: 200,       // #607d8b - Blue Gray
    delay: 200,       // #607d8b - Blue Gray
    serial: 200,      // #607d8b - Blue Gray

    // GPIO Blocks - Orange Red
    led: 15,          // #ff5722 - Orange Red
    digitalWrite: 15, // #ff5722 - Orange Red
    digitalRead: 15,  // #ff5722 - Orange Red
    analogWrite: 15,  // #ff5722 - Orange Red
    analogRead: 15,   // #ff5722 - Orange Red
    pinMode: 15,      // #ff5722 - Orange Red

    // Servo Blocks - Light Blue
    servo: 195,       // #4fc3f7 - Light Blue

    // Sensor Blocks - Various Colors
    ultrasonic: 355,  // #ff5252 - Red
    irSensor: 50,     // #ffd740 - Yellow
    dht: 145,         // #69f0ae - Light Green
    touch: 185,       // #80deea - Cyan
    soil: 30,         // #795548 - Brown
    sound: 55,        // #ffeb3b - Yellow
    irReceiver: 285,  // #e040fb - Purple
    joystick: 15,     // #ff9e80 - Deep Orange
    encoder: 260,     // #b388ff - Light Purple
    button: 175,      // #80cbc4 - Teal

    // Output Blocks - Various Colors
    buzzer: 10,       // #ffab91 - Light Orange
    relay: 145,       // #a5d6a7 - Light Green
    motor: 200,       // #90caf9 - Light Blue

    // Display Blocks - Purple
    lcd: 285,         // #ce93d8 - Light Purple

    // Communication Blocks - Yellow
    wifi: 55,         // #fff59d - Light Yellow

    // Logic Blocks - Pink
    logic: 330,       // #f48fb1 - Pink
    comparison: 330,  // #f48fb1 - Pink
    boolean: 330,     // #f48fb1 - Pink

    // Loop Blocks - Beige
    loops: 30,        // #bcaaa4 - Beige

    // Variable Blocks - Light Green
    variables: 85,    // #c5e1a5 - Light Green

    // Math Blocks - Light Blue
    math: 195,        // #81d4fa - Light Blue
    number: 195,      // #81d4fa - Light Blue
    operation: 195,   // #81d4fa - Light Blue
    map: 195,         // #81d4fa - Light Blue

    // AI Blocks - Various Colors
    aiCamera: 285,    // #9c27b0 - Purple
    aiGesture: 185,   // #00bcd4 - Cyan
    aiPose: 35,       // #ff9800 - Orange
    aiFace: 145,      // #4caf50 - Green
    aiSpeech: 210,    // #2196f3 - Blue
    aiControl: 330,   // #e91e63 - Pink
};

// ==========================================
// Blix Board Port to GPIO Mappings
// ==========================================
const BLIX_PORTS = {
    "PORT1": { pinA: "8", pinB: "7", label: "Port 1 (GPIO 8/7)" },
    "PORT2": { pinA: "2", pinB: "15", label: "Port 2 (GPIO 2/15)" },
    "PORT3": { pinA: "4", pinB: "0", label: "Port 3 (GPIO 4/0)" },
    "PORT4": { pinA: "27", pinB: "14", label: "Port 4 (GPIO 27/14)" },
    "PORT5": { pinA: "25", pinB: "26", label: "Port 5 (GPIO 25/26)" },
    "PORT6": { pinA: "33", pinB: "32", label: "Port 6 (GPIO 33/32)" },
    "PORT7": { pinA: "13", pinB: "12", label: "Port 7 (GPIO 13/12)" },
    "PORT8": { pinA: "10", pinB: "9", label: "Port 8 (GPIO 10/9)" }
};

// UNO Port mappings (PWM = pinA, DIR = pinB)
const UNO_PORTS = {
    "PORT1": { pinA: "3", pinB: "2", label: "Port 1 (D3/D2)" },
    "PORT2": { pinA: "5", pinB: "4", label: "Port 2 (D5/D4)" },
    "PORT3": { pinA: "6", pinB: "7", label: "Port 3 (D6/D7)" },
    "PORT4": { pinA: "9", pinB: "8", label: "Port 4 (D9/D8)" },
    "PORT5": { pinA: "10", pinB: "12", label: "Port 5 (D10/D12)" },
    "PORT6": { pinA: "11", pinB: "13", label: "Port 6 (D11/D13)" },
    "PORT7": { pinA: "3", pinB: "A0", label: "Port 7 (D3/A0)" },
    "PORT8": { pinA: "5", pinB: "A1", label: "Port 8 (D5/A1)" }
};

function getPortTable(boardFqbn) {
    return boardFqbn && boardFqbn.startsWith('arduino:avr') ? UNO_PORTS : BLIX_PORTS;
}

function getPortDropdown(boardFqbn) {
    const table = getPortTable(boardFqbn);
    return Object.entries(table).map(([key, val]) => [val.label, key]);
}

function getPortPins(port, boardFqbn) {
    const table = getPortTable(boardFqbn);
    return table[port] || table["PORT1"];
}

function getCurrentBoardFqbn() {
    const sel = document.getElementById('boardTypeSelect');
    return sel ? sel.value : 'esp32:esp32:esp32';
}

function getDynamicPinDropdown() {
    const fqbn = getCurrentBoardFqbn();
    if (fqbn && fqbn.startsWith('arduino:avr')) {
        return [
            ["D2", "2"],
            ["D3", "3"],
            ["D4", "4"],
            ["D5", "5"],
            ["D6", "6"],
            ["D7", "7"],
            ["D8", "8"],
            ["D9", "9"],
            ["D10", "10"],
            ["D11", "11"],
            ["D12", "12"],
            ["D13", "13"],
            ["A0", "A0"],
            ["A1", "A1"],
            ["A2", "A2"],
            ["A3", "A3"],
            ["A4", "A4"],
            ["A5", "A5"]
        ];
    }
    return [
        ["Port 1 - Pin A (GPIO 8)", "8"],
        ["Port 1 - Pin B (GPIO 7)", "7"],
        ["Port 2 - Pin A (GPIO 2)", "2"],
        ["Port 2 - Pin B (GPIO 15)", "15"],
        ["Port 3 - Pin A (GPIO 4)", "4"],
        ["Port 3 - Pin B (GPIO 0)", "0"],
        ["Port 4 - Pin A (GPIO 27)", "27"],
        ["Port 4 - Pin B (GPIO 14)", "14"],
        ["Port 5 - Pin A (GPIO 25)", "25"],
        ["Port 5 - Pin B (GPIO 26)", "26"],
        ["Port 6 - Pin A (GPIO 33)", "33"],
        ["Port 6 - Pin B (GPIO 32)", "32"],
        ["Port 7 - Pin A (GPIO 13)", "13"],
        ["Port 7 - Pin B (GPIO 12)", "12"],
        ["Port 8 - Pin A (GPIO 10)", "10"],
        ["Port 8 - Pin B (GPIO 9)", "9"],
        ["Built-in LED (GPIO 2)", "2"]
    ];
}

function getDynamicPortDropdown() {
    const fqbn = getCurrentBoardFqbn();
    if (fqbn && fqbn.startsWith('arduino:avr')) {
        return [
            ["Port 1 (D3/D2)", "PORT1"],
            ["Port 2 (D5/D4)", "PORT2"],
            ["Port 3 (D6/D7)", "PORT3"],
            ["Port 4 (D9/D8)", "PORT4"],
            ["Port 5 (D10/D12)", "PORT5"],
            ["Port 6 (D11/D13)", "PORT6"],
            ["Port 7 (D3/A0)", "PORT7"],
            ["Port 8 (D5/A1)", "PORT8"]
        ];
    }
    return [
        ["Port 1 (GPIO 8/7)", "PORT1"],
        ["Port 2 (GPIO 2/15)", "PORT2"],
        ["Port 3 (GPIO 4/0)", "PORT3"],
        ["Port 4 (GPIO 27/14)", "PORT4"],
        ["Port 5 (GPIO 25/26)", "PORT5"],
        ["Port 6 (GPIO 33/32)", "PORT6"],
        ["Port 7 (GPIO 13/12)", "PORT7"],
        ["Port 8 (GPIO 10/9)", "PORT8"]
    ];
}

// ==========================================
// CONTROL BLOCKS
// ==========================================

/**
 * Program Start Block - Entry point
 * Maps to void setup() + void loop() in Arduino
 */
Blockly.Blocks['start_program'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('start'));
        this.appendStatementInput("SETUP")
            .appendField("Setup");
        this.appendStatementInput("LOOP")
            .appendField("Loop");
        this.setColour(COLORS.start);
        this.setTooltip("Program entry point - Setup runs once, Loop runs continuously");
        this.setHelpUrl("");
        this.setDeletable(false);
    }
};

/**
 * Wait Block - Pauses execution
 * Maps to delay(ms) in Arduino
 */
Blockly.Blocks['delay_ms'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('delay'))
            .appendField(new Blockly.FieldNumber(1000, 0, 60000), "MS")
            .appendField(t('delayMs'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.delay);
        this.setTooltip("Pause program execution for specified milliseconds");
    }
};

/**
 * Serial Print Block
 * Maps to Serial.println() in Arduino
 */
Blockly.Blocks['serial_print'] = {
    init: function () {
        this.appendValueInput("MSG")
            .setCheck(null)
            .appendField(t('serialPrint'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.serial);
        this.setTooltip("Send data to serial monitor for debugging");
    }
};

/**
 * Text Value Block - String input
 */
Blockly.Blocks['text_value'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('"')
            .appendField(new Blockly.FieldTextInput("Hello"), "TEXT")
            .appendField('"');
        this.setOutput(true, "String");
        this.setColour(COLORS.serial);
        this.setTooltip("Enter text string value");
    }
};

/**
 * Comment Block - Adds comments to code
 */
Blockly.Blocks['comment_block'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('comment'))
            .appendField(new Blockly.FieldTextInput("// Your comment here"), "TEXT");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.start);
        this.setTooltip("Add a comment to your code");
    }
};

/**
 * Run Once Block - Code that runs only once
 */
Blockly.Blocks['run_once'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('runOnce'));
        this.appendStatementInput("DO")
            .appendField("do");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.start);
        this.setTooltip("Run these blocks only once at startup");
    }
};

/**
 * Break Block - Break out of loop
 */
Blockly.Blocks['break_loop'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('breakLoop'));
        this.setPreviousStatement(true, null);
        this.setColour(COLORS.loops);
        this.setTooltip("Break out of the current loop");
    }
};

/**
 * Continue Block - Continue to next iteration
 */
Blockly.Blocks['continue_loop'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('continueLoop'));
        this.setPreviousStatement(true, null);
        this.setColour(COLORS.loops);
        this.setTooltip("Skip to next iteration of the loop");
    }
};


// ==========================================
// GPIO BLOCKS
// ==========================================

/**
 * Turn LED On Block
 * Maps to digitalWrite(pin, HIGH) in Arduino
 */
Blockly.Blocks['led_on'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('ledOn'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldDropdown(getDynamicPinDropdown), "PIN");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.led);
        this.setTooltip("Set digital pin HIGH to turn LED on");
    }
};

/**
 * Turn LED Off Block
 * Maps to digitalWrite(pin, LOW) in Arduino
 */
Blockly.Blocks['led_off'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('ledOff'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldDropdown(getDynamicPinDropdown), "PIN");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.led);
        this.setTooltip("Set digital pin LOW to turn LED off");
    }
};

/**
 * Blink LED Block
 * Blinks LED with specified interval
 */
Blockly.Blocks['led_blink'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('ledBlink'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldDropdown(getDynamicPinDropdown), "PIN")
            .appendField(t('delay'))
            .appendField(new Blockly.FieldNumber(500, 50, 10000), "DELAY")
            .appendField("ms");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.led);
        this.setTooltip("Blink LED once with specified delay");
    }
};

/**
 * Digital Write Block
 * Maps to digitalWrite(pin, value) in Arduino
 */
Blockly.Blocks['digital_write'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('digitalWrite'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldDropdown(getDynamicPinDropdown), "PIN")
            .appendField(new Blockly.FieldDropdown([
                [t('high'), "HIGH"],
                [t('low'), "LOW"]
            ]), "STATE");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.digitalWrite);
        this.setTooltip("Write HIGH or LOW to digital pin");
    }
};

/**
 * Digital Read Block
 * Maps to digitalRead(pin) in Arduino
 */
Blockly.Blocks['digital_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('digitalRead'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(4, 0, 40), "PIN");
        this.setOutput(true, "Number");
        this.setColour(COLORS.digitalWrite);
        this.setTooltip("Read digital value (HIGH/LOW) from pin");
    }
};

/**
 * Analog Read Block
 * Maps to analogRead(pin) in Arduino
 */
Blockly.Blocks['analog_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('analogRead'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(34, 0, 40), "PIN");
        this.setOutput(true, "Number");
        this.setColour(COLORS.digitalWrite);
        this.setTooltip("Read analog value (0-4095) from pin");
    }
};

/**
 * Analog Write Block (PWM)
 * Maps to analogWrite(pin, value) in Arduino
 */
Blockly.Blocks['analog_write'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('analogWrite'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(2, 0, 40), "PIN")
            .appendField(t('value'))
            .appendField(new Blockly.FieldNumber(128, 0, 255), "VALUE");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.digitalWrite);
        this.setTooltip("Write PWM value (0-255) to pin");
    }
};

/**
 * Set Pin Mode Block
 * Maps to pinMode(pin, mode) in Arduino
 */
Blockly.Blocks['pin_mode'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('pinModeBlock'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(2, 0, 40), "PIN")
            .appendField(new Blockly.FieldDropdown([
                [t('modeOutput'), "OUTPUT"],
                [t('modeInput'), "INPUT"],
                ["INPUT_PULLUP", "INPUT_PULLUP"]
            ]), "MODE");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.digitalWrite);
        this.setTooltip("Configure pin as INPUT or OUTPUT");
    }
};


// ==========================================
// SERVO BLOCKS
// ==========================================

/**
 * Set Servo Angle Block
 * Maps to servo.write(angle) in Arduino
 */
Blockly.Blocks['servo_control'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('servoControl'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(13, 0, 40), "PIN")
            .appendField(t('angle'))
            .appendField(new Blockly.FieldNumber(90, 0, 180), "ANGLE");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.servo);
        this.setTooltip("Set servo motor to specified angle (0-180 degrees)");
    }
};

/**
 * Sweep Servo Block
 * Sweeps servo from one angle to another
 */
Blockly.Blocks['servo_sweep'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('servoSweep'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(13, 0, 40), "PIN");
        this.appendDummyInput()
            .appendField("   ")
            .appendField(t('fromAngle'))
            .appendField(new Blockly.FieldNumber(0, 0, 180), "FROM")
            .appendField(t('toAngle'))
            .appendField(new Blockly.FieldNumber(180, 0, 180), "TO")
            .appendField(t('speed'))
            .appendField(new Blockly.FieldNumber(15, 1, 100), "SPEED")
            .appendField("ms");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.servo);
        this.setTooltip("Sweep servo between angles with specified delay");
    }
};

/**
 * Attach Servo Block
 * Attaches servo to a pin
 */
Blockly.Blocks['servo_attach'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('servoAttach'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(13, 0, 40), "PIN");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.servo);
        this.setTooltip("Attach servo motor to specified pin");
    }
};

/**
 * Detach Servo Block
 * Detaches servo from pin
 */
Blockly.Blocks['servo_detach'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('servoDetach'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(13, 0, 40), "PIN");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.servo);
        this.setTooltip("Detach servo motor from pin (stops PWM signal)");
    }
};


// ==========================================
// SENSOR BLOCKS
// ==========================================

/**
 * Ultrasonic Setup Block
 * Sets up the trigger and echo pins
 */
Blockly.Blocks['ultrasonic_setup'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('ultrasonicSetup'))
            .appendField(t('trigPin'))
            .appendField(new Blockly.FieldNumber(5, 0, 40), "TRIG")
            .appendField(t('echoPin'))
            .appendField(new Blockly.FieldNumber(18, 0, 40), "ECHO");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.ultrasonic);
        this.setTooltip("Configure ultrasonic sensor pins");
    }
};

/**
 * Ultrasonic Read Distance Block
 * Returns distance in centimeters
 */
Blockly.Blocks['ultrasonic_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('ultrasonicRead'))
            .appendField(t('trigPin'))
            .appendField(new Blockly.FieldNumber(5, 0, 40), "TRIG")
            .appendField(t('echoPin'))
            .appendField(new Blockly.FieldNumber(18, 0, 40), "ECHO");
        this.setOutput(true, "Number");
        this.setColour(COLORS.ultrasonic);
        this.setTooltip("Read distance in centimeters (2-400 cm range)");
    }
};


// ==========================================
// IR SENSOR BLOCKS
// ==========================================

/**
 * IR Sensor Read Block
 * Returns raw digital reading (0 or 1)
 */
Blockly.Blocks['ir_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('irRead'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(14, 0, 40), "PIN");
        this.setOutput(true, "Number");
        this.setColour(COLORS.irSensor);
        this.setTooltip("Read IR sensor value (0 = obstacle, 1 = clear)");
    }
};

/**
 * IR Obstacle Detected Block
 * Returns boolean - true if obstacle detected
 */
Blockly.Blocks['ir_detected'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('irDetected'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(14, 0, 40), "PIN");
        this.setOutput(true, "Boolean");
        this.setColour(COLORS.irSensor);
        this.setTooltip("Returns true if obstacle detected");
    }
};

/**
 * IR Line Detected Block
 * Returns boolean - true if line detected (for line following robots)
 */
Blockly.Blocks['ir_line_detected'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('irLineDetected'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(14, 0, 40), "PIN");
        this.setOutput(true, "Boolean");
        this.setColour(COLORS.irSensor);
        this.setTooltip("Returns true if line detected (white on black or black on white)");
    }
};


// ==========================================
// BUZZER BLOCKS
// ==========================================

/**
 * Buzzer On Block
 */
Blockly.Blocks['buzzer_on'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('buzzerOn'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldDropdown(getDynamicPinDropdown), "PIN");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.buzzer);
        this.setTooltip("Turn buzzer on");
    }
};

/**
 * Buzzer Off Block
 */
Blockly.Blocks['buzzer_off'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('buzzerOff'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldDropdown(getDynamicPinDropdown), "PIN");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.buzzer);
        this.setTooltip("Turn buzzer off");
    }
};

/**
 * Play Tone Block
 * Maps to tone(pin, frequency, duration)
 */
Blockly.Blocks['buzzer_tone'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('buzzerTone'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldDropdown(getDynamicPinDropdown), "PIN");
        this.appendDummyInput()
            .appendField("   ")
            .appendField(t('frequency'))
            .appendField(new Blockly.FieldNumber(1000, 20, 20000), "FREQ")
            .appendField(t('duration'))
            .appendField(new Blockly.FieldNumber(500, 50, 10000), "DUR");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.buzzer);
        this.setTooltip("Play tone at specified frequency and duration");
    }
};

/**
 * Play Musical Note Block
 * Plays standard musical notes
 */
Blockly.Blocks['buzzer_note'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('note'))
            .appendField(new Blockly.FieldDropdown([
                ["C (Do)", "262"],
                ["D (Re)", "294"],
                ["E (Mi)", "330"],
                ["F (Fa)", "349"],
                ["G (Sol)", "392"],
                ["A (La)", "440"],
                ["B (Si)", "494"],
                ["C5 (High Do)", "523"]
            ]), "NOTE")
            .appendField(t('pin'))
            .appendField(new Blockly.FieldDropdown(getDynamicPinDropdown), "PIN")
            .appendField(t('duration'))
            .appendField(new Blockly.FieldNumber(300, 50, 5000), "DUR");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.buzzer);
        this.setTooltip("Play musical note on buzzer");
    }
};

/**
 * Stop Tone Block
 * Maps to noTone(pin)
 */
Blockly.Blocks['buzzer_notone'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Stop Tone")
            .appendField(t('pin'))
            .appendField(new Blockly.FieldDropdown(getDynamicPinDropdown), "PIN");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.buzzer);
        this.setTooltip("Stop tone on buzzer");
    }
};


// ==========================================
// RELAY BLOCKS
// ==========================================

/**
 * Relay On Block
 */
Blockly.Blocks['relay_on'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('relayOn'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(26, 0, 40), "PIN");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.relay);
        this.setTooltip("Turn relay on");
    }
};

/**
 * Relay Off Block
 */
Blockly.Blocks['relay_off'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('relayOff'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(26, 0, 40), "PIN");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.relay);
        this.setTooltip("Turn relay off");
    }
};

/**
 * Relay Toggle Block
 * Toggles relay state (on to off, off to on)
 */
Blockly.Blocks['relay_toggle'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('relayToggle'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(26, 0, 40), "PIN");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.relay);
        this.setTooltip("Toggle relay state");
    }
};


// ==========================================
// DC MOTOR BLOCKS
// ==========================================

/**
 * Motor Forward Block
 */
Blockly.Blocks['motor_forward'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('motorForward'))
            .appendField(new Blockly.FieldDropdown(getDynamicPortDropdown), "PORT")
            .appendField(t('motorSpeed'))
            .appendField(new Blockly.FieldNumber(200, 0, 255), "SPEED");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.motor);
        this.setTooltip("Spin DC motor forward on selected port");
    }
};

/**
 * Motor Backward Block
 */
Blockly.Blocks['motor_backward'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('motorBackward'))
            .appendField(new Blockly.FieldDropdown(getDynamicPortDropdown), "PORT")
            .appendField(t('motorSpeed'))
            .appendField(new Blockly.FieldNumber(200, 0, 255), "SPEED");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.motor);
        this.setTooltip("Spin DC motor backward on selected port");
    }
};

/**
 * Motor Stop Block
 */
Blockly.Blocks['motor_stop'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('motorStop'))
            .appendField(new Blockly.FieldDropdown(getDynamicPortDropdown), "PORT");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.motor);
        this.setTooltip("Stop DC motor on selected port");
    }
};


// ==========================================
// DHT SENSOR BLOCKS
// ==========================================

/**
 * DHT Setup Block
 */
Blockly.Blocks['dht_setup'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('dhtSetup'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(4, 0, 40), "PIN")
            .appendField(t('dhtType'))
            .appendField(new Blockly.FieldDropdown([
                ["DHT11", "DHT11"],
                ["DHT22", "DHT22"]
            ]), "TYPE");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.dht);
        this.setTooltip("Configure DHT temperature and humidity sensor");
    }
};

/**
 * DHT Read Temperature Block
 */
Blockly.Blocks['dht_read_temp'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('dhtReadTemp'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(4, 0, 40), "PIN");
        this.setOutput(true, "Number");
        this.setColour(COLORS.dht);
        this.setTooltip("Read temperature in Celsius");
    }
};

/**
 * DHT Read Humidity Block
 */
Blockly.Blocks['dht_read_humidity'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('dhtReadHumidity'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(4, 0, 40), "PIN");
        this.setOutput(true, "Number");
        this.setColour(COLORS.dht);
        this.setTooltip("Read humidity percentage");
    }
};

/**
 * DHT Heat Index Block
 * Calculates perceived temperature based on humidity
 */
Blockly.Blocks['dht_heat_index'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('dhtHeatIndex'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(4, 0, 40), "PIN");
        this.setOutput(true, "Number");
        this.setColour(COLORS.dht);
        this.setTooltip("Calculate heat index (perceived temperature)");
    }
};


// ==========================================
// TOUCH SENSOR BLOCKS
// ==========================================

/**
 * Touch Read Block
 */
Blockly.Blocks['touch_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('touchRead'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldDropdown([
                ["T0 (GPIO 4)", "4"],
                ["T1 (GPIO 0)", "0"],
                ["T2 (GPIO 2)", "2"],
                ["T3 (GPIO 15)", "15"],
                ["T4 (GPIO 13)", "13"],
                ["T5 (GPIO 12)", "12"],
                ["T6 (GPIO 14)", "14"],
                ["T7 (GPIO 27)", "27"],
                ["T8 (GPIO 33)", "33"],
                ["T9 (GPIO 32)", "32"]
            ]), "PIN");
        this.setOutput(true, "Number");
        this.setColour(COLORS.touch);
        this.setTooltip("Read touch sensor value");
    }
};

/**
 * Touch Detected Block
 */
Blockly.Blocks['touch_detected'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('touchThreshold'))
            .appendField(new Blockly.FieldNumber(40, 0, 100), "THRESHOLD")
            .appendField(t('pin'))
            .appendField(new Blockly.FieldDropdown([
                ["T0 (GPIO 4)", "4"],
                ["T2 (GPIO 2)", "2"],
                ["T3 (GPIO 15)", "15"],
                ["T4 (GPIO 13)", "13"],
                ["T5 (GPIO 12)", "12"],
                ["T6 (GPIO 14)", "14"],
                ["T7 (GPIO 27)", "27"],
                ["T8 (GPIO 33)", "33"],
                ["T9 (GPIO 32)", "32"]
            ]), "PIN");
        this.setOutput(true, "Boolean");
        this.setColour(COLORS.touch);
        this.setTooltip("Returns true if touch detected");
    }
};


// ==========================================
// LCD DISPLAY BLOCKS
// ==========================================

/**
 * LCD Setup Block
 */
Blockly.Blocks['lcd_setup'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('lcdSetup'))
            .appendField(t('address'))
            .appendField(new Blockly.FieldDropdown([
                ["0x27", "0x27"],
                ["0x3F", "0x3F"]
            ]), "ADDR")
            .appendField("16x2");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.lcd);
        this.setTooltip("Initialize I2C LCD display");
    }
};

/**
 * LCD Print Block
 */
Blockly.Blocks['lcd_print'] = {
    init: function () {
        this.appendValueInput("TEXT")
            .setCheck(null)
            .appendField(t('lcdPrint'));
        this.appendDummyInput()
            .appendField(t('row'))
            .appendField(new Blockly.FieldNumber(0, 0, 3), "ROW")
            .appendField(t('col'))
            .appendField(new Blockly.FieldNumber(0, 0, 19), "COL");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.lcd);
        this.setTooltip("Print text on LCD at specified position");
    }
};

/**
 * LCD Clear Block
 */
Blockly.Blocks['lcd_clear'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('lcdClear'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.lcd);
        this.setTooltip("Clear LCD display");
    }
};


// ==========================================
// SOIL MOISTURE SENSOR BLOCKS
// ==========================================

/**
 * Soil Moisture Read Block
 */
Blockly.Blocks['soil_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('soilRead'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(34, 0, 40), "PIN");
        this.setOutput(true, "Number");
        this.setColour(COLORS.soil);
        this.setTooltip("Read soil moisture value (0-4095, lower = wetter)");
    }
};

/**
 * Soil Is Dry Block
 */
Blockly.Blocks['soil_is_dry'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('soilIsDry'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(34, 0, 40), "PIN")
            .appendField(t('soilThreshold'))
            .appendField(new Blockly.FieldNumber(3000, 0, 4095), "THRESHOLD");
        this.setOutput(true, "Boolean");
        this.setColour(COLORS.soil);
        this.setTooltip("Returns true if soil is dry");
    }
};


// ==========================================
// SOUND SENSOR BLOCKS
// ==========================================

/**
 * Sound Sensor Read Block
 */
Blockly.Blocks['sound_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('soundRead'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(35, 0, 40), "PIN");
        this.setOutput(true, "Number");
        this.setColour(COLORS.sound);
        this.setTooltip("Read sound level (0-4095, higher = louder)");
    }
};

/**
 * Sound Detected Block
 */
Blockly.Blocks['sound_detected'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('soundDetected'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(35, 0, 40), "PIN")
            .appendField(t('soundThreshold'))
            .appendField(new Blockly.FieldNumber(2000, 0, 4095), "THRESHOLD");
        this.setOutput(true, "Boolean");
        this.setColour(COLORS.sound);
        this.setTooltip("Returns true if sound exceeds threshold");
    }
};

/**
 * Sound Clap Detected Block
 * Detects clapping sounds (sudden loud sound followed by quiet)
 */
Blockly.Blocks['sound_clap_detected'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('soundClapDetected'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(35, 0, 40), "PIN")
            .appendField(t('soundThreshold'))
            .appendField(new Blockly.FieldNumber(2500, 0, 4095), "THRESHOLD");
        this.setOutput(true, "Boolean");
        this.setColour(COLORS.sound);
        this.setTooltip("Returns true when a clap is detected");
    }
};


// ==========================================
// IR RECEIVER BLOCKS
// ==========================================

/**
 * IR Receiver Setup Block
 */
Blockly.Blocks['ir_receive_setup'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('irRecvSetup'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(15, 0, 40), "PIN");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.irReceiver);
        this.setTooltip("Configure IR receiver module");
    }
};

/**
 * IR Receiver Read Code Block
 */
Blockly.Blocks['ir_receive_code'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('irRecvCode'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(15, 0, 40), "PIN");
        this.setOutput(true, "Number");
        this.setColour(COLORS.irReceiver);
        this.setTooltip("Read IR remote code");
    }
};


// ==========================================
// JOYSTICK MODULE BLOCKS
// ==========================================

/**
 * Joystick Read X Block
 */
Blockly.Blocks['joystick_read_x'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('joystickReadX'))
            .appendField(t('xPin'))
            .appendField(new Blockly.FieldNumber(34, 0, 40), "PIN");
        this.setOutput(true, "Number");
        this.setColour(COLORS.joystick);
        this.setTooltip("Read joystick X-axis (0-4095)");
    }
};

/**
 * Joystick Read Y Block
 */
Blockly.Blocks['joystick_read_y'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('joystickReadY'))
            .appendField(t('yPin'))
            .appendField(new Blockly.FieldNumber(35, 0, 40), "PIN");
        this.setOutput(true, "Number");
        this.setColour(COLORS.joystick);
        this.setTooltip("Read joystick Y-axis (0-4095)");
    }
};

/**
 * Joystick Button Block
 */
Blockly.Blocks['joystick_button'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('joystickButton'))
            .appendField(t('btnPin'))
            .appendField(new Blockly.FieldNumber(32, 0, 40), "PIN");
        this.setOutput(true, "Boolean");
        this.setColour(COLORS.joystick);
        this.setTooltip("Returns true if joystick button pressed");
    }
};


// ==========================================
// ROTARY ENCODER BLOCKS
// ==========================================

/**
 * Rotary Encoder Setup Block
 */
Blockly.Blocks['encoder_setup'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('encoderSetup'))
            .appendField(t('clkPin'))
            .appendField(new Blockly.FieldNumber(25, 0, 40), "CLK")
            .appendField(t('dtPin'))
            .appendField(new Blockly.FieldNumber(26, 0, 40), "DT")
            .appendField(t('swPin'))
            .appendField(new Blockly.FieldNumber(27, 0, 40), "SW");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.encoder);
        this.setTooltip("Configure rotary encoder pins");
    }
};

/**
 * Rotary Encoder Read Position Block
 */
Blockly.Blocks['encoder_read_position'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('encoderPosition'));
        this.setOutput(true, "Number");
        this.setColour(COLORS.encoder);
        this.setTooltip("Read encoder position value");
    }
};

/**
 * Rotary Encoder Button Block
 */
Blockly.Blocks['encoder_button'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('encoderButton'))
            .appendField(t('swPin'))
            .appendField(new Blockly.FieldNumber(27, 0, 40), "SW");
        this.setOutput(true, "Boolean");
        this.setColour(COLORS.encoder);
        this.setTooltip("Returns true if encoder button pressed");
    }
};


// ==========================================
// PUSH BUTTON BLOCK
// ==========================================

/**
 * Push Button Pressed Block
 */
Blockly.Blocks['button_pressed'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('buttonPressed'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(4, 0, 40), "PIN");
        this.setOutput(true, "Boolean");
        this.setColour(COLORS.button);
        this.setTooltip("Returns true if button is pressed");
    }
};

/**
 * Push Button Released Block
 */
Blockly.Blocks['button_released'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('buttonReleased'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(4, 0, 40), "PIN");
        this.setOutput(true, "Boolean");
        this.setColour(COLORS.button);
        this.setTooltip("Returns true if button is released");
    }
};

/**
 * Push Button Long Press Block
 */
Blockly.Blocks['button_long_press'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('buttonLongPress'))
            .appendField(t('pin'))
            .appendField(new Blockly.FieldNumber(4, 0, 40), "PIN")
            .appendField("ms")
            .appendField(new Blockly.FieldNumber(1000, 500, 5000), "DURATION");
        this.setOutput(true, "Boolean");
        this.setColour(COLORS.button);
        this.setTooltip("Returns true if button is pressed for specified duration");
    }
};


// ==========================================
// WIFI BLOCKS
// ==========================================

/**
 * WiFi Connect Block
 */
Blockly.Blocks['wifi_connect'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('wifiConnect'));
        this.appendDummyInput()
            .appendField("   ")
            .appendField(t('wifiSSID'))
            .appendField(new Blockly.FieldTextInput("MyWiFi"), "SSID")
            .appendField(t('wifiPassword'))
            .appendField(new Blockly.FieldTextInput("password"), "PASS");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.wifi);
        this.setTooltip("Connect to WiFi network");
    }
};

/**
 * WiFi Get IP Block
 */
Blockly.Blocks['wifi_get_ip'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('wifiGetIP'));
        this.setOutput(true, "String");
        this.setColour(COLORS.wifi);
        this.setTooltip("Get device IP address");
    }
};

/**
 * WiFi Is Connected Block
 */
Blockly.Blocks['wifi_is_connected'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('wifiIsConnected'));
        this.setOutput(true, "Boolean");
        this.setColour(COLORS.wifi);
        this.setTooltip("Returns true if WiFi is connected");
    }
};

/**
 * WiFi Disconnect Block
 */
Blockly.Blocks['wifi_disconnect'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('wifiDisconnect'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.wifi);
        this.setTooltip("Disconnect from WiFi network");
    }
};

/**
 * WiFi HTTP GET Block
 */
Blockly.Blocks['wifi_http_get'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('wifiHTTPGet'))
            .appendField(t('wifiURL'))
            .appendField(new Blockly.FieldTextInput("http://example.com"), "URL");
        this.setOutput(true, "String");
        this.setColour(COLORS.wifi);
        this.setTooltip("Send HTTP GET request and return response");
    }
};

/**
 * WiFi HTTP POST Block
 */
Blockly.Blocks['wifi_http_post'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('wifiHTTPPost'))
            .appendField(t('wifiURL'))
            .appendField(new Blockly.FieldTextInput("http://example.com"), "URL");
        this.appendValueInput("DATA")
            .setCheck("String")
            .appendField(t('wifiResponse'));
        this.setOutput(true, "String");
        this.setColour(COLORS.wifi);
        this.setTooltip("Send HTTP POST request with data and return response");
    }
};


// ==========================================
// LOGIC BLOCKS
// ==========================================

/**
 * If / Else Block
 */
Blockly.Blocks['if_condition'] = {
    init: function () {
        this.appendValueInput("CONDITION")
            .appendField(t('ifCondition'));
        this.appendStatementInput("DO")
            .appendField(t('then'));
        this.appendStatementInput("ELSE")
            .appendField(t('elseText'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.logic);
        this.setTooltip("If condition is true, run then blocks; otherwise run else blocks");
    }
};

/**
 * Comparison Block
 */
Blockly.Blocks['comparison'] = {
    init: function () {
        this.appendValueInput("A")
            .setCheck("Number");
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                ["=", "EQ"],
                ["≠", "NEQ"],
                ["<", "LT"],
                [">", "GT"],
                ["≤", "LTE"],
                ["≥", "GTE"]
            ]), "OP");
        this.appendValueInput("B")
            .setCheck("Number");
        this.setInputsInline(true);
        this.setOutput(true, "Boolean");
        this.setColour(COLORS.comparison);
        this.setTooltip("Compare two values");
    }
};

/**
 * Boolean Block
 */
Blockly.Blocks['boolean_value'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                ["true", "TRUE"],
                ["false", "FALSE"]
            ]), "BOOL");
        this.setOutput(true, "Boolean");
        this.setColour(COLORS.boolean);
        this.setTooltip("Boolean true or false value");
    }
};

/**
 * Logic Operation Block (AND, OR, NOT)
 */
Blockly.Blocks['logic_operation'] = {
    init: function () {
        this.appendValueInput("A")
            .setCheck("Boolean");
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                [t('andOp'), "AND"],
                [t('orOp'), "OR"]
            ]), "OP");
        this.appendValueInput("B")
            .setCheck("Boolean");
        this.setInputsInline(true);
        this.setOutput(true, "Boolean");
        this.setColour(COLORS.logic);
        this.setTooltip("Logic AND or OR operation");
    }
};

/**
 * Logic NOT Block
 */
Blockly.Blocks['logic_not'] = {
    init: function () {
        this.appendValueInput("BOOL")
            .setCheck("Boolean")
            .appendField(t('notOp'));
        this.setOutput(true, "Boolean");
        this.setColour(COLORS.logic);
        this.setTooltip("Logic NOT operation");
    }
};


// ==========================================
// LOOPS BLOCKS
// ==========================================

/**
 * Repeat Times Block
 */
Blockly.Blocks['repeat_times'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('repeatLoop'))
            .appendField(new Blockly.FieldNumber(10, 0, 1000), "TIMES")
            .appendField(t('times'));
        this.appendStatementInput("DO")
            .appendField("do");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.loops);
        this.setTooltip("Repeat blocks specified number of times");
    }
};

/**
 * Forever Loop Block
 */
Blockly.Blocks['forever_loop'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('foreverLoop'));
        this.appendStatementInput("DO")
            .appendField("do");
        this.setPreviousStatement(true, null);
        this.setColour(COLORS.loops);
        this.setTooltip("Run blocks forever in a loop");
    }
};

/**
 * While Loop Block
 */
Blockly.Blocks['while_loop'] = {
    init: function () {
        this.appendValueInput("CONDITION")
            .setCheck("Boolean")
            .appendField(t('whileLoop'));
        this.appendStatementInput("DO")
            .appendField("do");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.loops);
        this.setTooltip("Run blocks while condition is true");
    }
};

/**
 * For Loop Block
 */
Blockly.Blocks['for_loop'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('forLoop'))
            .appendField(new Blockly.FieldTextInput("i"), "VAR")
            .appendField(t('from'))
            .appendField(new Blockly.FieldNumber(0), "FROM")
            .appendField(t('to'))
            .appendField(new Blockly.FieldNumber(10), "TO")
            .appendField(t('step'))
            .appendField(new Blockly.FieldNumber(1), "STEP");
        this.appendStatementInput("DO")
            .appendField("do");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.loops);
        this.setTooltip("Run blocks for each value in range");
    }
};


// ==========================================
// VARIABLES BLOCKS
// ==========================================

/**
 * Set Variable Block
 */
Blockly.Blocks['set_variable'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('setVariable'))
            .appendField(new Blockly.FieldTextInput("var"), "VAR")
            .appendField(t('to'));
        this.appendValueInput("VALUE")
            .setCheck(null);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.variables);
        this.setTooltip("Set variable to a value");
    }
};

/**
 * Get Variable Block
 */
Blockly.Blocks['get_variable'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('getVariable'))
            .appendField(new Blockly.FieldTextInput("var"), "VAR");
        this.setOutput(true, null);
        this.setColour(COLORS.variables);
        this.setTooltip("Get variable value");
    }
};


// ==========================================
// MATH BLOCKS
// ==========================================

/**
 * Math Number Block
 */
Blockly.Blocks['math_number'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Number")
            .appendField(new Blockly.FieldNumber(0), "NUM");
        this.setOutput(true, "Number");
        this.setColour(COLORS.number);
        this.setTooltip("Numeric value");
    }
};

/**
 * Math Operation Block
 */
Blockly.Blocks['math_operation'] = {
    init: function () {
        this.appendValueInput("A")
            .setCheck("Number");
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                ["+", "ADD"],
                ["−", "MINUS"],
                ["×", "MULTIPLY"],
                ["÷", "DIVIDE"],
                ["%", "MODULO"]
            ]), "OP");
        this.appendValueInput("B")
            .setCheck("Number");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(COLORS.operation);
        this.setTooltip("Mathematical operation");
    }
};

/**
 * Map Value Block
 */
Blockly.Blocks['map_value'] = {
    init: function () {
        this.setOutput(true, "Number");
        this.appendValueInput("VALUE")
            .setCheck("Number")
            .appendField("Map");
        this.appendDummyInput()
            .appendField("in")
            .appendField(new Blockly.FieldNumber(0), "IN_MIN")
            .appendField("~")
            .appendField(new Blockly.FieldNumber(4095), "IN_MAX");
        this.appendDummyInput()
            .appendField("out")
            .appendField(new Blockly.FieldNumber(0), "OUT_MIN")
            .appendField("~")
            .appendField(new Blockly.FieldNumber(255), "OUT_MAX");
        this.setColour(COLORS.map);
        this.setTooltip("Map value from one range to another");
    }
};

/**
 * Random Number Block
 */
Blockly.Blocks['math_random'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('mathRandom'))
            .appendField(new Blockly.FieldNumber(0), "MIN")
            .appendField(t('to'))
            .appendField(new Blockly.FieldNumber(100), "MAX");
        this.setOutput(true, "Number");
        this.setColour(COLORS.math);
        this.setTooltip("Generate random number between min and max");
    }
};

/**
 * Min Block
 */
Blockly.Blocks['math_min'] = {
    init: function () {
        this.appendValueInput("A")
            .setCheck("Number");
        this.appendDummyInput()
            .appendField(t('mathMin'));
        this.appendValueInput("B")
            .setCheck("Number");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(COLORS.math);
        this.setTooltip("Return the minimum of two values");
    }
};

/**
 * Max Block
 */
Blockly.Blocks['math_max'] = {
    init: function () {
        this.appendValueInput("A")
            .setCheck("Number");
        this.appendDummyInput()
            .appendField(t('mathMax'));
        this.appendValueInput("B")
            .setCheck("Number");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(COLORS.math);
        this.setTooltip("Return the maximum of two values");
    }
};

/**
 * Absolute Value Block
 */
Blockly.Blocks['math_abs'] = {
    init: function () {
        this.appendValueInput("NUM")
            .setCheck("Number")
            .appendField(t('mathAbs'));
        this.setOutput(true, "Number");
        this.setColour(COLORS.math);
        this.setTooltip("Return absolute value");
    }
};

/**
 * Round Block
 */
Blockly.Blocks['math_round'] = {
    init: function () {
        this.appendValueInput("NUM")
            .setCheck("Number")
            .appendField(t('mathRound'));
        this.setOutput(true, "Number");
        this.setColour(COLORS.math);
        this.setTooltip("Round to nearest integer");
    }
};

/**
 * Floor Block
 */
Blockly.Blocks['math_floor'] = {
    init: function () {
        this.appendValueInput("NUM")
            .setCheck("Number")
            .appendField(t('mathFloor'));
        this.setOutput(true, "Number");
        this.setColour(COLORS.math);
        this.setTooltip("Round down to nearest integer");
    }
};

/**
 * Ceil Block
 */
Blockly.Blocks['math_ceil'] = {
    init: function () {
        this.appendValueInput("NUM")
            .setCheck("Number")
            .appendField(t('mathCeil'));
        this.setOutput(true, "Number");
        this.setColour(COLORS.math);
        this.setTooltip("Round up to nearest integer");
    }
};

/**
 * Square Root Block
 */
Blockly.Blocks['math_sqrt'] = {
    init: function () {
        this.appendValueInput("NUM")
            .setCheck("Number")
            .appendField(t('mathSqrt'));
        this.setOutput(true, "Number");
        this.setColour(COLORS.math);
        this.setTooltip("Calculate square root");
    }
};

/**
 * Power Block
 */
Blockly.Blocks['math_pow'] = {
    init: function () {
        this.appendValueInput("BASE")
            .setCheck("Number");
        this.appendDummyInput()
            .appendField(t('mathPow'));
        this.appendValueInput("EXP")
            .setCheck("Number");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(COLORS.math);
        this.setTooltip("Calculate base to the power of exponent");
    }
};

/**
 * Sine Block
 */
Blockly.Blocks['math_sin'] = {
    init: function () {
        this.appendValueInput("DEG")
            .setCheck("Number")
            .appendField(t('mathSin'));
        this.setOutput(true, "Number");
        this.setColour(COLORS.math);
        this.setTooltip("Calculate sine (input in degrees)");
    }
};

/**
 * Cosine Block
 */
Blockly.Blocks['math_cos'] = {
    init: function () {
        this.appendValueInput("DEG")
            .setCheck("Number")
            .appendField(t('mathCos'));
        this.setOutput(true, "Number");
        this.setColour(COLORS.math);
        this.setTooltip("Calculate cosine (input in degrees)");
    }
};

/**
 * Tangent Block
 */
Blockly.Blocks['math_tan'] = {
    init: function () {
        this.appendValueInput("DEG")
            .setCheck("Number")
            .appendField(t('mathTan'));
        this.setOutput(true, "Number");
        this.setColour(COLORS.math);
        this.setTooltip("Calculate tangent (input in degrees)");
    }
};

/**
 * Custom Code Snippet Block
 */
Blockly.Blocks['code_snippet'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(t('codeSnippet'));
        this.appendDummyInput()
            .appendField(new Blockly.FieldTextInput("// code here"), "CODE");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(COLORS.math);
        this.setTooltip("Write custom Arduino C++ code directly");
    }
};


// ==========================================
// Function to re-initialize blocks with new language
// ==========================================

/**
 * Switches the block language and refreshes the workspace
 * @param {string} lang - Language code ('en' or 'mr')
 * @param {Blockly.WorkspaceSvg} workspace - The Blockly workspace
 */
function switchBlockLanguage(lang, workspace) {
    currentLang = lang;
    const state = Blockly.serialization.workspaces.save(workspace);
    Blockly.serialization.workspaces.load(state, workspace);
}


// ==========================================
// ELECTROMAGNET & MAGNETIC SENSOR BLOCKS
// ==========================================

/**
 * Electromagnet On Block
 */
Blockly.Blocks['electromagnet_on'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Electromagnet ON')
            .appendField('GPIO Pin')
            .appendField(new Blockly.FieldNumber(25, 0, 40), 'PIN');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(200);
        this.setTooltip('Activate electromagnet on the specified GPIO pin');
    }
};

/**
 * Electromagnet Off Block
 */
Blockly.Blocks['electromagnet_off'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Electromagnet OFF')
            .appendField('GPIO Pin')
            .appendField(new Blockly.FieldNumber(25, 0, 40), 'PIN');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(200);
        this.setTooltip('Deactivate electromagnet on the specified GPIO pin');
    }
};

/**
 * Magnetic Sensor Read Block (analog)
 */
Blockly.Blocks['magnetic_sensor_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Read Magnetic Sensor')
            .appendField('GPIO Pin')
            .appendField(new Blockly.FieldNumber(34, 0, 40), 'PIN');
        this.setOutput(true, 'Number');
        this.setColour(200);
        this.setTooltip('Read analog value from Hall Effect / magnetic sensor (0-4095)');
    }
};

/**
 * Magnetic Sensor Detected Block
 */
Blockly.Blocks['magnetic_sensor_detected'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Magnet Detected')
            .appendField('GPIO Pin')
            .appendField(new Blockly.FieldNumber(34, 0, 40), 'PIN')
            .appendField('Threshold')
            .appendField(new Blockly.FieldNumber(500, 0, 4095), 'THRESHOLD');
        this.setOutput(true, 'Boolean');
        this.setColour(200);
        this.setTooltip('Returns true when magnetic sensor reads above threshold value');
    }
};
