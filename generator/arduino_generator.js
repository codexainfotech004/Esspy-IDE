/**
 * =============================================
 * BharatBlocks IDE - Arduino C++ Code Generator
 * =============================================
 * 
 * Converts Blockly workspace blocks into valid Arduino C++
 * code for ESP32/Arduino boards.
 * 
 * Supported devices:
 *   - LED, Digital/Analog I/O
 *   - Servo Motor (ESP32Servo library)
 *   - Ultrasonic Sensor HC-SR04
 *   - IR Sensor (digital)
 *   - Buzzer (tone/noTone)
 *   - Relay Module
 *   - DC Motor (L298N/L293D)
 *   - DHT11/DHT22 Temperature & Humidity
 *   - ESP32 Touch Sensor
 *   - I2C LCD Display
 * 
 * Author: BharatBlocks Team
 * License: MIT
 */

// ==========================================
// Initialize Arduino Code Generator
// ==========================================
const arduinoGenerator = new Blockly.Generator('Arduino');

// Board-aware helpers
function _isUno() {
    const sel = document.getElementById('boardTypeSelect');
    return sel && sel.value === 'arduino:avr:uno';
}

function _portPins(port) {
    const table = _isUno() ? {
        "PORT1": { pwm: "3", dir: "2" },
        "PORT2": { pwm: "5", dir: "4" },
        "PORT3": { pwm: "6", dir: "7" },
        "PORT4": { pwm: "9", dir: "8" },
        "PORT5": { pwm: "10", dir: "12" },
        "PORT6": { pwm: "11", dir: "13" },
        "PORT7": { pwm: "3", dir: "A0" },
        "PORT8": { pwm: "5", dir: "A1" }
    } : {
        "PORT1": { pwm: "8", dir: "7" },
        "PORT2": { pwm: "2", dir: "15" },
        "PORT3": { pwm: "4", dir: "0" },
        "PORT4": { pwm: "27", dir: "14" },
        "PORT5": { pwm: "25", dir: "26" },
        "PORT6": { pwm: "33", dir: "32" },
        "PORT7": { pwm: "13", dir: "12" },
        "PORT8": { pwm: "10", dir: "9" }
    };
    return table[port] || table["PORT1"];
}

// Operator precedence levels
arduinoGenerator.ORDER_ATOMIC = 0;
arduinoGenerator.ORDER_UNARY_PREFIX = 1;
arduinoGenerator.ORDER_MULTIPLICATIVE = 2;
arduinoGenerator.ORDER_ADDITIVE = 3;
arduinoGenerator.ORDER_RELATIONAL = 4;
arduinoGenerator.ORDER_EQUALITY = 5;
arduinoGenerator.ORDER_LOGICAL_AND = 6;
arduinoGenerator.ORDER_LOGICAL_OR = 7;
arduinoGenerator.ORDER_ASSIGNMENT = 8;
arduinoGenerator.ORDER_NONE = 99;

// ==========================================
// Generator Configuration
// ==========================================
arduinoGenerator.INDENT = '  ';
arduinoGenerator.includes_ = {};
arduinoGenerator.setupCode_ = '';
arduinoGenerator.variables_ = {};
arduinoGenerator.functions_ = {};

arduinoGenerator.init = function (workspace) {
    this.includes_ = {};
    this.setupCode_ = {};
    this.variables_ = {};
    this.functions_ = {};
    // Use new Blockly v12 API to avoid deprecation warning
    if (!this.nameDB_) {
        this.nameDB_ = new Blockly.Names(Blockly.Names.DEVELOPER_VARIABLE_PREFIX || '');
    }
    this.nameDB_.setVariableMap(workspace.getVariableMap());
};

arduinoGenerator.finish = function (code) {
    // Collect includes
    let includeCode = '';
    for (let key in this.includes_) {
        includeCode += this.includes_[key] + '\n';
    }

    // Collect variable declarations
    let varCode = '';
    for (let key in this.variables_) {
        varCode += this.variables_[key] + '\n';
    }

    // Collect helper functions
    let funcCode = '';
    for (let key in this.functions_) {
        funcCode += this.functions_[key] + '\n';
    }

    let finalCode = '';
    if (includeCode) finalCode += '// === Libraries ===\n' + includeCode + '\n';
    if (varCode) finalCode += '// === Variables ===\n' + varCode + '\n';
    if (funcCode) finalCode += '// === Helper Functions ===\n' + funcCode + '\n';
    finalCode += code;

    return finalCode;
};

arduinoGenerator.scrubNakedValue = function (line) {
    return line + ';\n';
};

arduinoGenerator.scrub_ = function (block, code, thisOnly) {
    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    if (nextBlock && !thisOnly) {
        return code + arduinoGenerator.blockToCode(nextBlock);
    }
    return code;
};


// ==========================================
// BASIC BLOCK GENERATORS
// ==========================================

arduinoGenerator.forBlock['start_program'] = function (block, generator) {
    const setupCode = generator.statementToCode(block, 'SETUP');
    const loopCode = generator.statementToCode(block, 'LOOP');

    // Collect auto-generated setup code (e.g. servo.attach)
    let autoSetup = '';
    for (let key in generator.setupCode_) {
        autoSetup += '  ' + generator.setupCode_[key] + '\n';
    }

    let code = '// === Setup (runs once at startup) ===\n';
    code += 'void setup() {\n';
    code += _isUno() ? '  Serial.begin(9600);  // Initialize Serial Monitor\n' : '  Serial.begin(115200);  // Initialize Serial Monitor\n';
    if (autoSetup) code += autoSetup;
    if (setupCode) code += setupCode;
    code += '}\n\n';
    code += '// === Loop (runs continuously) ===\n';
    code += 'void loop() {\n';
    if (loopCode) code += loopCode;
    code += '}\n';

    return code;
};

arduinoGenerator.forBlock['delay_ms'] = function (block) {
    const ms = block.getFieldValue('MS');
    return `delay(${ms});\n`;
};

arduinoGenerator.forBlock['serial_print'] = function (block, generator) {
    const msg = generator.valueToCode(block, 'MSG', generator.ORDER_ATOMIC) || '""';
    return `Serial.println(${msg});\n`;
};

arduinoGenerator.forBlock['text_value'] = function (block, generator) {
    const text = block.getFieldValue('TEXT');
    return [`"${text}"`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['comment_block'] = function (block) {
    const text = block.getFieldValue('TEXT');
    return `// ${text}\n`;
};

arduinoGenerator.forBlock['run_once'] = function (block, generator) {
    const doCode = generator.statementToCode(block, 'DO');
    return doCode;
};

arduinoGenerator.forBlock['break_loop'] = function (block) {
    return 'break;\n';
};

arduinoGenerator.forBlock['continue_loop'] = function (block) {
    return 'continue;\n';
};


// ==========================================
// ESP32 / ARDUINO BLOCK GENERATORS
// ==========================================

arduinoGenerator.forBlock['led_on'] = function (block) {
    const pin = block.getFieldValue('PIN');
    return `pinMode(${pin}, OUTPUT);\ndigitalWrite(${pin}, HIGH);  // LED ON\n`;
};

arduinoGenerator.forBlock['led_off'] = function (block) {
    const pin = block.getFieldValue('PIN');
    return `pinMode(${pin}, OUTPUT);\ndigitalWrite(${pin}, LOW);   // LED OFF\n`;
};

arduinoGenerator.forBlock['led_blink'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const delay = block.getFieldValue('DELAY');
    let code = `pinMode(${pin}, OUTPUT);\n`;
    code += `digitalWrite(${pin}, HIGH);  // LED ON\n`;
    code += `delay(${delay});\n`;
    code += `digitalWrite(${pin}, LOW);   // LED OFF\n`;
    code += `delay(${delay});\n`;
    return code;
};

arduinoGenerator.forBlock['digital_write'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const state = block.getFieldValue('STATE');
    return `digitalWrite(${pin}, ${state});\n`;
};

arduinoGenerator.forBlock['digital_read'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    return [`digitalRead(${pin})`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['analog_read'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    return [`analogRead(${pin})`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['analog_write'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const value = block.getFieldValue('VALUE');
    return `analogWrite(${pin}, ${value});  // PWM output\n`;
};

arduinoGenerator.forBlock['pin_mode'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const mode = block.getFieldValue('MODE');
    return `pinMode(${pin}, ${mode});\n`;
};


// ==========================================
// SERVO BLOCK GENERATORS
// ==========================================

arduinoGenerator.forBlock['servo_control'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const angle = block.getFieldValue('ANGLE');
    const servoVar = `servo_pin${pin}`;

    generator.includes_['servo'] = _isUno() ? '#include <Servo.h>' : '#include <ESP32Servo.h>';
    generator.variables_[servoVar] = `Servo ${servoVar};`;

    // Attach servo in setup (only once)
    generator.setupCode_[`servo_attach_${pin}`] = `${servoVar}.attach(${pin});`;

    let code = `${servoVar}.write(${angle});  // Set servo to ${angle}°\n`;
    return code;
};

arduinoGenerator.forBlock['servo_sweep'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const from = block.getFieldValue('FROM');
    const to = block.getFieldValue('TO');
    const speed = block.getFieldValue('SPEED');
    const servoVar = `servo_pin${pin}`;

    generator.includes_['servo'] = _isUno() ? '#include <Servo.h>' : '#include <ESP32Servo.h>';
    generator.variables_[servoVar] = `Servo ${servoVar};`;

    let code = `${servoVar}.attach(${pin});\n`;
    code += `// Sweep servo from ${from}° to ${to}°\n`;
    if (from <= to) {
        code += `for (int angle = ${from}; angle <= ${to}; angle++) {\n`;
        code += `  ${servoVar}.write(angle);\n`;
        code += `  delay(${speed});\n`;
        code += `}\n`;
    } else {
        code += `for (int angle = ${from}; angle >= ${to}; angle--) {\n`;
        code += `  ${servoVar}.write(angle);\n`;
        code += `  delay(${speed});\n`;
        code += `}\n`;
    }
    return code;
};

arduinoGenerator.forBlock['servo_attach'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const servoVar = `servo_pin${pin}`;

    generator.includes_['servo'] = _isUno() ? '#include <Servo.h>' : '#include <ESP32Servo.h>';
    generator.variables_[servoVar] = `Servo ${servoVar};`;

    return `${servoVar}.attach(${pin});  // Attach servo to pin ${pin}\n`;
};

arduinoGenerator.forBlock['servo_detach'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const servoVar = `servo_pin${pin}`;

    generator.includes_['servo'] = _isUno() ? '#include <Servo.h>' : '#include <ESP32Servo.h>';
    generator.variables_[servoVar] = `Servo ${servoVar};`;

    return `${servoVar}.detach();  // Detach servo from pin ${pin}\n`;
};


// ==========================================
// ULTRASONIC SENSOR (HC-SR04) GENERATORS
// ==========================================

arduinoGenerator.forBlock['ultrasonic_setup'] = function (block) {
    const trig = block.getFieldValue('TRIG');
    const echo = block.getFieldValue('ECHO');

    let code = `// Ultrasonic sensor setup\n`;
    code += `pinMode(${trig}, OUTPUT);  // Trigger pin\n`;
    code += `pinMode(${echo}, INPUT);   // Echo pin\n`;
    return code;
};

arduinoGenerator.forBlock['ultrasonic_read'] = function (block, generator) {
    const trig = block.getFieldValue('TRIG');
    const echo = block.getFieldValue('ECHO');

    // Add helper function for reading distance
    const funcName = `readUltrasonic_${trig}_${echo}`;
    generator.functions_[funcName] = `
// Read distance from HC-SR04 (Trig: ${trig}, Echo: ${echo})
float ${funcName}() {
  digitalWrite(${trig}, LOW);
  delayMicroseconds(2);
  digitalWrite(${trig}, HIGH);
  delayMicroseconds(10);
  digitalWrite(${trig}, LOW);
  long duration = pulseIn(${echo}, HIGH, 30000);  // 30ms timeout
  float distance = duration * 0.034 / 2.0;  // Speed of sound = 0.034 cm/μs
  if (distance == 0 || distance > 400) return 999;  // Out of range
  return distance;
}`;

    return [`${funcName}()`, generator.ORDER_ATOMIC];
};


// ==========================================
// IR SENSOR GENERATORS
// ==========================================

arduinoGenerator.forBlock['ir_read'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    // Plain INPUT: IR modules have their own pull resistors; INPUT_PULLUP fights them
    generator.setupCode_[`ir_pin_${pin}`] = `pinMode(${pin}, INPUT);`;
    return [`digitalRead(${pin})  /* IR sensor */`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['ir_detected'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.setupCode_[`ir_pin_${pin}`] = `pinMode(${pin}, INPUT);`;
    // Most IR obstacle sensors output LOW when obstacle detected
    return [`(digitalRead(${pin}) == LOW)  /* IR obstacle */`, generator.ORDER_EQUALITY];
};

arduinoGenerator.forBlock['ir_line_detected'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.setupCode_[`ir_pin_${pin}`] = `pinMode(${pin}, INPUT);`;
    // IR line sensors: LOW = line detected (black absorbs IR → sensor output LOW)
    return [`(digitalRead(${pin}) == LOW)  /* IR line on black */`, generator.ORDER_EQUALITY];
};


// ==========================================
// BUZZER BLOCK GENERATORS
// ==========================================
// NOTE: ESP32 does NOT support Arduino's tone()/noTone().
// We use the ESP32 LEDC PWM API instead:
//   - ledcAttach(pin, freq, resolution) — attach pin to LEDC
//   - ledcWriteTone(pin, freq)          — play a frequency
//   - ledcWrite(pin, 0)                 — stop tone

arduinoGenerator.forBlock['buzzer_on'] = function (block) {
    const pin = block.getFieldValue('PIN');
    let code = `pinMode(${pin}, OUTPUT);\n`;
    code += `digitalWrite(${pin}, HIGH);     // High for active buzzer\n`;
    return code;
};

arduinoGenerator.forBlock['buzzer_off'] = function (block) {
    const pin = block.getFieldValue('PIN');
    let code = `digitalWrite(${pin}, LOW);     // Turn off active buzzer\n`;
    return code;
};

arduinoGenerator.forBlock['buzzer_tone'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const freq = block.getFieldValue('FREQ');
    const dur = block.getFieldValue('DUR');

    if (_isUno()) {
        return `tone(${pin}, ${freq});\ndelay(${dur});\nnoTone(${pin});  // Play ${freq}Hz for ${dur}ms\n`;
    }

    // ESP32: Use a helper function for tone via LEDC
    generator.functions_['esp32_tone'] = `
// ESP32 Tone Helper using LEDC PWM
void esp32Tone(int pin, int freq, int duration) {
  ledcAttach(pin, freq, 8);    // Attach pin with frequency, 8-bit resolution
  ledcWriteTone(pin, freq);    // Start playing tone
  ledcWrite(pin, 127);         // Set 50% duty cycle for max volume!
  delay(duration);             // Wait for duration
  ledcWrite(pin, 0);           // Stop tone
}`;

    return `esp32Tone(${pin}, ${freq}, ${dur});  // Play ${freq}Hz for ${dur}ms\n`;
};

arduinoGenerator.forBlock['buzzer_note'] = function (block, generator) {
    const note = block.getFieldValue('NOTE');
    const pin = block.getFieldValue('PIN');
    const dur = block.getFieldValue('DUR');

    if (_isUno()) {
        return `tone(${pin}, ${note});\ndelay(${dur});\nnoTone(${pin});  // Play musical note\ndelay(50);  // Gap between notes\n`;
    }

    // ESP32: Reuse the same LEDC helper
    generator.functions_['esp32_tone'] = `
// ESP32 Tone Helper using LEDC PWM
void esp32Tone(int pin, int freq, int duration) {
  ledcAttach(pin, freq, 8);    // Attach pin with frequency, 8-bit resolution
  ledcWriteTone(pin, freq);    // Start playing tone
  ledcWrite(pin, 127);         // Set 50% duty cycle for max volume!
  delay(duration);             // Wait for duration
  ledcWrite(pin, 0);           // Stop tone
}`;

    return `esp32Tone(${pin}, ${note}, ${dur});  // Play musical note\ndelay(50);  // Gap between notes\n`;
};

arduinoGenerator.forBlock['buzzer_notone'] = function (block) {
    const pin = block.getFieldValue('PIN');
    if (_isUno()) {
        return `noTone(${pin});  // Stop tone on pin ${pin}\n`;
    }
    let code = `ledcWrite(${pin}, 0);  // Stop tone on pin ${pin}\n`;
    code += `digitalWrite(${pin}, LOW);\n`;
    return code;
};


// ==========================================
// RELAY BLOCK GENERATORS
// ==========================================

arduinoGenerator.forBlock['relay_on'] = function (block) {
    const pin = block.getFieldValue('PIN');
    let code = `pinMode(${pin}, OUTPUT);\n`;
    code += `digitalWrite(${pin}, LOW);   // Relay ON (active-low)\n`;
    return code;
};

arduinoGenerator.forBlock['relay_off'] = function (block) {
    const pin = block.getFieldValue('PIN');
    let code = `pinMode(${pin}, OUTPUT);\n`;
    code += `digitalWrite(${pin}, HIGH);  // Relay OFF (active-low)\n`;
    return code;
};

arduinoGenerator.forBlock['relay_toggle'] = function (block) {
    const pin = block.getFieldValue('PIN');
    let code = `pinMode(${pin}, OUTPUT);\n`;
    code += `digitalWrite(${pin}, !digitalRead(${pin}));  // Toggle relay\n`;
    return code;
};


// ==========================================
// DC MOTOR BLOCK GENERATORS (L298N/L293D)
// ==========================================

arduinoGenerator.forBlock['motor_forward'] = function (block, generator) {
    const port = block.getFieldValue('PORT');
    const speed = block.getFieldValue('SPEED');
    const pins = _portPins(port);
    const isUno = _isUno();

    // Pin setup — emitted only once into setup()
    // NOTE: ledcAttach must be called before any ledcWrite on the PWM pin
    generator.setupCode_[`motor_${port}_pins`] = (
        `// Motor ${port} pin setup\n` +
        `pinMode(${pins.pwm}, OUTPUT);\n` +
        `pinMode(${pins.dir}, OUTPUT);\n` +
        `digitalWrite(${pins.dir}, LOW);\n` +
        (isUno ? '' : `ledcAttach(${pins.pwm}, 5000, 8); // Attach LEDC PWM\n`)
    );

    // Direction + speed — emitted at the block location
    let code = `// Motor Forward on ${port}\n`;
    code += `digitalWrite(${pins.dir}, HIGH);\n`;
    code += isUno ? `analogWrite(${pins.pwm}, ${speed});\n` : `ledcWrite(${pins.pwm}, ${speed});\n`;
    return code;
};

arduinoGenerator.forBlock['motor_backward'] = function (block, generator) {
    const port = block.getFieldValue('PORT');
    const speed = block.getFieldValue('SPEED');
    const pins = _portPins(port);
    const isUno = _isUno();

    // Pin setup — emitted only once into setup()
    generator.setupCode_[`motor_${port}_pins`] = (
        `// Motor ${port} pin setup\n` +
        `pinMode(${pins.pwm}, OUTPUT);\n` +
        `pinMode(${pins.dir}, OUTPUT);\n` +
        `digitalWrite(${pins.dir}, LOW);\n` +
        (isUno ? '' : `ledcAttach(${pins.pwm}, 5000, 8); // Attach LEDC PWM\n`)
    );

    // Direction + speed — emitted at the block location
    let code = `// Motor Backward on ${port}\n`;
    code += `digitalWrite(${pins.dir}, LOW);\n`;
    code += isUno ? `analogWrite(${pins.pwm}, ${speed});\n` : `ledcWrite(${pins.pwm}, ${speed});\n`;
    return code;
};

arduinoGenerator.forBlock['motor_stop'] = function (block, generator) {
    const port = block.getFieldValue('PORT');
    const pins = _portPins(port);
    const isUno = _isUno();

    // Ensure pin setup is always emitted even if only a stop block is used
    generator.setupCode_[`motor_${port}_pins`] = generator.setupCode_[`motor_${port}_pins`] || (
        `// Motor ${port} pin setup\n` +
        `pinMode(${pins.pwm}, OUTPUT);\n` +
        `pinMode(${pins.dir}, OUTPUT);\n` +
        `digitalWrite(${pins.dir}, LOW);\n` +
        (isUno ? '' : `ledcAttach(${pins.pwm}, 5000, 8); // Attach LEDC PWM\n`)
    );

    let code = `// Motor Stop on ${port}\n`;
    code += `digitalWrite(${pins.dir}, LOW);\n`;
    code += isUno ? `analogWrite(${pins.pwm}, 0);\n` : `ledcWrite(${pins.pwm}, 0);\n`;
    return code;
};


// ==========================================
// DHT SENSOR GENERATORS (DHT11 / DHT22)
// ==========================================

arduinoGenerator.forBlock['dht_setup'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const type = block.getFieldValue('TYPE');
    const dhtVar = `dht_pin${pin}`;

    generator.includes_['dht'] = '#include <DHT.h>';
    generator.variables_[dhtVar] = `DHT ${dhtVar}(${pin}, ${type});`;

    return `${dhtVar}.begin();  // Initialize ${type} sensor on pin ${pin}\n`;
};

arduinoGenerator.forBlock['dht_read_temp'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const dhtVar = `dht_pin${pin}`;

    generator.includes_['dht'] = '#include <DHT.h>';

    return [`${dhtVar}.readTemperature()`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['dht_read_humidity'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const dhtVar = `dht_pin${pin}`;

    generator.includes_['dht'] = '#include <DHT.h>';

    return [`${dhtVar}.readHumidity()`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['dht_heat_index'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const dhtVar = `dht_pin${pin}`;

    generator.includes_['dht'] = '#include <DHT.h>';

    return [`${dhtVar}.computeHeatIndex()`, generator.ORDER_ATOMIC];
};


// ==========================================
// ESP32 TOUCH SENSOR GENERATORS
// ==========================================

arduinoGenerator.forBlock['touch_read'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    return [`touchRead(${pin})`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['touch_detected'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const threshold = block.getFieldValue('THRESHOLD');
    return [`(touchRead(${pin}) < ${threshold})`, generator.ORDER_RELATIONAL];
};


// ==========================================
// LCD DISPLAY GENERATORS (I2C)
// ==========================================

arduinoGenerator.forBlock['lcd_setup'] = function (block, generator) {
    const addr = block.getFieldValue('ADDR');

    generator.includes_['wire'] = '#include <Wire.h>';
    generator.includes_['lcd'] = '#include <LiquidCrystal_I2C.h>';
    generator.variables_['lcd'] = `LiquidCrystal_I2C lcd(${addr}, 16, 2);`;

    let code = `lcd.init();       // Initialize LCD\n`;
    code += `lcd.backlight();  // Turn on backlight\n`;
    return code;
};

arduinoGenerator.forBlock['lcd_print'] = function (block, generator) {
    const text = generator.valueToCode(block, 'TEXT', generator.ORDER_ATOMIC) || '""';
    const row = block.getFieldValue('ROW');
    const col = block.getFieldValue('COL');

    return `lcd.setCursor(${col}, ${row});\nlcd.print(${text});\n`;
};

arduinoGenerator.forBlock['lcd_clear'] = function () {
    return `lcd.clear();\n`;
};


// ==========================================
// LOGIC BLOCK GENERATORS
// ==========================================

arduinoGenerator.forBlock['if_condition'] = function (block, generator) {
    const condition = generator.valueToCode(block, 'CONDITION', generator.ORDER_NONE) || 'true';
    const doCode = generator.statementToCode(block, 'DO');
    const elseCode = generator.statementToCode(block, 'ELSE');

    let code = `if (${condition}) {\n`;
    code += doCode || '';
    code += '}';
    if (elseCode) {
        code += ` else {\n`;
        code += elseCode;
        code += '}';
    }
    code += '\n';
    return code;
};

arduinoGenerator.forBlock['comparison'] = function (block, generator) {
    const opMap = { 'EQ': '==', 'NEQ': '!=', 'LT': '<', 'GT': '>', 'LTE': '<=', 'GTE': '>=' };
    const op = opMap[block.getFieldValue('OP')];
    const a = generator.valueToCode(block, 'A', generator.ORDER_RELATIONAL) || '0';
    const b = generator.valueToCode(block, 'B', generator.ORDER_RELATIONAL) || '0';
    return [`(${a} ${op} ${b})`, generator.ORDER_RELATIONAL];
};

arduinoGenerator.forBlock['boolean_value'] = function (block, generator) {
    return [block.getFieldValue('BOOL').toLowerCase(), generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['logic_operation'] = function (block, generator) {
    const opMap = { 'AND': '&&', 'OR': '||' };
    const op = opMap[block.getFieldValue('OP')];
    const order = op === '&&' ? generator.ORDER_LOGICAL_AND : generator.ORDER_LOGICAL_OR;
    const a = generator.valueToCode(block, 'A', order) || 'false';
    const b = generator.valueToCode(block, 'B', order) || 'false';
    return [`(${a} ${op} ${b})`, order];
};

arduinoGenerator.forBlock['logic_not'] = function (block, generator) {
    const value = generator.valueToCode(block, 'VALUE', generator.ORDER_UNARY_PREFIX) || 'true';
    return [`!${value}`, generator.ORDER_UNARY_PREFIX];
};


// ==========================================
// LOOP BLOCK GENERATORS
// ==========================================

arduinoGenerator.forBlock['repeat_times'] = function (block, generator) {
    const times = block.getFieldValue('TIMES');
    const doCode = generator.statementToCode(block, 'DO');
    const loopVar = 'i_' + Math.floor(Math.random() * 1000);
    let code = `for (int ${loopVar} = 0; ${loopVar} < ${times}; ${loopVar}++) {\n`;
    code += doCode || '';
    code += '}\n';
    return code;
};

arduinoGenerator.forBlock['forever_loop'] = function (block, generator) {
    const doCode = generator.statementToCode(block, 'DO');
    return `while (true) {\n${doCode || ''}}\n`;
};

arduinoGenerator.forBlock['while_loop'] = function (block, generator) {
    const condition = generator.valueToCode(block, 'CONDITION', generator.ORDER_NONE) || 'true';
    const doCode = generator.statementToCode(block, 'DO');
    return `while (${condition}) {\n${doCode || ''}}\n`;
};

arduinoGenerator.forBlock['for_loop'] = function (block, generator) {
    const varName = block.getFieldValue('VAR');
    const from = block.getFieldValue('FROM');
    const to = block.getFieldValue('TO');
    const step = block.getFieldValue('STEP');
    const doCode = generator.statementToCode(block, 'DO');
    return `for (int ${varName} = ${from}; ${varName} <= ${to}; ${varName} += ${step}) {\n${doCode || ''}}\n`;
};


// ==========================================
// VARIABLE BLOCK GENERATORS
// ==========================================

arduinoGenerator.forBlock['set_variable'] = function (block, generator) {
    const varName = block.getFieldValue('VAR');
    const value = generator.valueToCode(block, 'VALUE', generator.ORDER_ASSIGNMENT) || '0';
    generator.variables_[varName] = `int ${varName};`;
    return `${varName} = ${value};\n`;
};

arduinoGenerator.forBlock['get_variable'] = function (block, generator) {
    return [block.getFieldValue('VAR'), generator.ORDER_ATOMIC];
};


// ==========================================
// MATH BLOCK GENERATORS
// ==========================================

arduinoGenerator.forBlock['math_number_value'] = function (block, generator) {
    return [String(block.getFieldValue('NUM')), generator.ORDER_ATOMIC];
};
arduinoGenerator.forBlock['math_number'] = arduinoGenerator.forBlock['math_number_value'];

arduinoGenerator.forBlock['math_operation'] = function (block, generator) {
    const opMap = { 'ADD': '+', 'SUB': '-', 'MUL': '*', 'DIV': '/', 'MOD': '%' };
    const op = opMap[block.getFieldValue('OP')];
    const order = (op === '*' || op === '/' || op === '%')
        ? generator.ORDER_MULTIPLICATIVE : generator.ORDER_ADDITIVE;
    const a = generator.valueToCode(block, 'A', order) || '0';
    const b = generator.valueToCode(block, 'B', order) || '0';
    return [`(${a} ${op} ${b})`, order];
};

arduinoGenerator.forBlock['map_value'] = function (block, generator) {
    const value = generator.valueToCode(block, 'VALUE', generator.ORDER_ATOMIC) || '0';
    const fromLow = block.getFieldValue('FROM_LOW');
    const fromHigh = block.getFieldValue('FROM_HIGH');
    const toLow = block.getFieldValue('TO_LOW');
    const toHigh = block.getFieldValue('TO_HIGH');
    return [`map(${value}, ${fromLow}, ${fromHigh}, ${toLow}, ${toHigh})`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['math_random'] = function (block, generator) {
    const min = block.getFieldValue('MIN');
    const max = block.getFieldValue('MAX');
    return [`random(${min}, ${max})`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['math_min'] = function (block, generator) {
    const a = generator.valueToCode(block, 'A', generator.ORDER_ATOMIC) || '0';
    const b = generator.valueToCode(block, 'B', generator.ORDER_ATOMIC) || '0';
    return [`min(${a}, ${b})`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['math_max'] = function (block, generator) {
    const a = generator.valueToCode(block, 'A', generator.ORDER_ATOMIC) || '0';
    const b = generator.valueToCode(block, 'B', generator.ORDER_ATOMIC) || '0';
    return [`max(${a}, ${b})`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['math_abs'] = function (block, generator) {
    const num = generator.valueToCode(block, 'NUM', generator.ORDER_ATOMIC) || '0';
    return [`abs(${num})`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['math_round'] = function (block, generator) {
    const num = generator.valueToCode(block, 'NUM', generator.ORDER_ATOMIC) || '0';
    return [`round(${num})`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['math_floor'] = function (block, generator) {
    const num = generator.valueToCode(block, 'NUM', generator.ORDER_ATOMIC) || '0';
    return [`floor(${num})`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['math_ceil'] = function (block, generator) {
    const num = generator.valueToCode(block, 'NUM', generator.ORDER_ATOMIC) || '0';
    return [`ceil(${num})`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['math_sqrt'] = function (block, generator) {
    const num = generator.valueToCode(block, 'NUM', generator.ORDER_ATOMIC) || '0';
    return [`sqrt(${num})`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['math_pow'] = function (block, generator) {
    const base = generator.valueToCode(block, 'BASE', generator.ORDER_ATOMIC) || '0';
    const exp = generator.valueToCode(block, 'EXP', generator.ORDER_ATOMIC) || '0';
    return [`pow(${base}, ${exp})`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['math_sin'] = function (block, generator) {
    const deg = generator.valueToCode(block, 'DEG', generator.ORDER_ATOMIC) || '0';
    return [`sin(${deg} * PI / 180)`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['math_cos'] = function (block, generator) {
    const deg = generator.valueToCode(block, 'DEG', generator.ORDER_ATOMIC) || '0';
    return [`cos(${deg} * PI / 180)`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['math_tan'] = function (block, generator) {
    const deg = generator.valueToCode(block, 'DEG', generator.ORDER_ATOMIC) || '0';
    return [`tan(${deg} * PI / 180)`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['code_snippet'] = function (block) {
    const code = block.getFieldValue('CODE');
    return `${code}\n`;
};


// ==========================================
// SOIL MOISTURE SENSOR GENERATORS
// ==========================================

arduinoGenerator.forBlock['soil_read'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    return [`analogRead(${pin})  /* Soil moisture */`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['soil_is_dry'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const threshold = block.getFieldValue('THRESHOLD');
    return [`(analogRead(${pin}) > ${threshold})  /* Soil is dry? */`, generator.ORDER_RELATIONAL];
};


// ==========================================
// SOUND SENSOR GENERATORS
// ==========================================

arduinoGenerator.forBlock['sound_read'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    return [`analogRead(${pin})  /* Sound level */`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['sound_detected'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const threshold = block.getFieldValue('THRESHOLD');
    return [`(analogRead(${pin}) > ${threshold})  /* Sound detected? */`, generator.ORDER_RELATIONAL];
};

arduinoGenerator.forBlock['sound_clap_detected'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const threshold = block.getFieldValue('THRESHOLD');
    return [`(analogRead(${pin}) > ${threshold})  /* Clap detected? */`, generator.ORDER_RELATIONAL];
};


// ==========================================
// IR RECEIVER GENERATORS (Remote Control)
// ==========================================

arduinoGenerator.forBlock['ir_receive_setup'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');

    generator.includes_['irremote'] = '#include <IRremote.h>';
    generator.variables_['ir_recv'] = `IRrecv irRecv(${pin});\ndecode_results irResults;`;
    generator.setupCode_['ir_recv'] = `irRecv.enableIRIn();  // Start IR receiver`;

    return `// IR Receiver initialized on pin ${pin}\n`;
};

arduinoGenerator.forBlock['ir_receive_code'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');

    generator.includes_['irremote'] = '#include <IRremote.h>';
    generator.variables_['ir_recv'] = `IRrecv irRecv(${pin});\ndecode_results irResults;`;

    generator.functions_['ir_read_code'] = `
// Read IR remote code
unsigned long readIRCode() {
  if (irRecv.decode(&irResults)) {
    unsigned long code = irResults.value;
    irRecv.resume();  // Ready to receive next code
    return code;
  }
  return 0;  // No code received
}`;

    return [`readIRCode()`, generator.ORDER_ATOMIC];
};


// ==========================================
// JOYSTICK MODULE GENERATORS
// ==========================================

arduinoGenerator.forBlock['joystick_read_x'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    return [`analogRead(${pin})  /* Joystick X */`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['joystick_read_y'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    return [`analogRead(${pin})  /* Joystick Y */`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['joystick_button'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.setupCode_[`joybtn_${pin}`] = `pinMode(${pin}, INPUT_PULLUP);`;
    return [`(digitalRead(${pin}) == LOW)  /* Joystick button */`, generator.ORDER_EQUALITY];
};


// ==========================================
// ROTARY ENCODER GENERATORS
// ==========================================

arduinoGenerator.forBlock['encoder_setup'] = function (block, generator) {
    const clk = block.getFieldValue('CLK');
    const dt = block.getFieldValue('DT');
    const sw = block.getFieldValue('SW');

    generator.variables_['encoder'] = `// Rotary Encoder pins\nconst int ENC_CLK = ${clk};\nconst int ENC_DT = ${dt};\nconst int ENC_SW = ${sw};\nvolatile int encoderPos = 0;\nint lastCLK = HIGH;`;

    generator.functions_['encoder_read'] = `
// Read rotary encoder (call in loop)
void updateEncoder() {
  int currentCLK = digitalRead(ENC_CLK);
  if (currentCLK != lastCLK && currentCLK == LOW) {
    if (digitalRead(ENC_DT) != currentCLK) {
      encoderPos++;
    } else {
      encoderPos--;
    }
  }
  lastCLK = currentCLK;
}`;

    let code = `// Encoder setup\n`;
    code += `pinMode(ENC_CLK, INPUT_PULLUP);\n`;
    code += `pinMode(ENC_DT, INPUT_PULLUP);\n`;
    code += `pinMode(ENC_SW, INPUT_PULLUP);\n`;
    return code;
};

arduinoGenerator.forBlock['encoder_read_position'] = function (block, generator) {
    return [`encoderPos  /* Encoder position */`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['encoder_button'] = function (block, generator) {
    const sw = block.getFieldValue('SW');
    return [`(digitalRead(${sw}) == LOW)  /* Encoder button */`, generator.ORDER_EQUALITY];
};


// ==========================================
// PUSH BUTTON GENERATOR
// ==========================================

arduinoGenerator.forBlock['button_pressed'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.setupCode_[`btn_${pin}`] = `pinMode(${pin}, INPUT_PULLUP);`;
    return [`(digitalRead(${pin}) == LOW)  /* Button pressed */`, generator.ORDER_EQUALITY];
};

arduinoGenerator.forBlock['button_released'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.setupCode_[`btn_${pin}`] = `pinMode(${pin}, INPUT_PULLUP);`;
    return [`(digitalRead(${pin}) == HIGH)  /* Button released */`, generator.ORDER_EQUALITY];
};

arduinoGenerator.forBlock['button_long_press'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const duration = block.getFieldValue('DURATION');
    generator.setupCode_[`btn_${pin}`] = `pinMode(${pin}, INPUT_PULLUP);`;
    // Simplified long press detection - in real implementation would need timing logic
    return [`(digitalRead(${pin}) == LOW)  /* Long press (${duration}ms) */`, generator.ORDER_EQUALITY];
};


// ==========================================
// WIFI GENERATORS (ESP32 / ESP8266)
// ==========================================

arduinoGenerator.forBlock['wifi_connect'] = function (block, generator) {
    const ssid = block.getFieldValue('SSID');
    const pass = block.getFieldValue('PASS');

    generator.includes_['wifi'] = '#include <WiFi.h>';

    let code = `// Connect to WiFi\n`;
    code += `WiFi.begin("${ssid}", "${pass}");\n`;
    code += `Serial.print("Connecting to WiFi");\n`;
    code += `while (WiFi.status() != WL_CONNECTED) {\n`;
    code += `  delay(500);\n`;
    code += `  Serial.print(".");\n`;
    code += `}\n`;
    code += `Serial.println("\\nConnected! IP: " + WiFi.localIP().toString());\n`;
    return code;
};

arduinoGenerator.forBlock['wifi_get_ip'] = function (block, generator) {
    generator.includes_['wifi'] = '#include <WiFi.h>';
    return [`WiFi.localIP().toString()`, generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['wifi_is_connected'] = function (block, generator) {
    generator.includes_['wifi'] = '#include <WiFi.h>';
    return [`(WiFi.status() == WL_CONNECTED)`, generator.ORDER_EQUALITY];
};

arduinoGenerator.forBlock['wifi_disconnect'] = function (block, generator) {
    generator.includes_['wifi'] = '#include <WiFi.h>';
    return `WiFi.disconnect();\n`;
};

arduinoGenerator.forBlock['wifi_http_get'] = function (block, generator) {
    const url = block.getFieldValue('URL');
    generator.includes_['wifi'] = '#include <WiFi.h>';
    generator.includes_['http'] = '#include <HTTPClient.h>';
    return `// HTTP GET to ${url}\nHTTPClient http;\nhttp.begin("${url}");\nint httpCode = http.GET();\nString payload = http.getString();\nhttp.end();\n`;
};

arduinoGenerator.forBlock['wifi_http_post'] = function (block, generator) {
    const url = block.getFieldValue('URL');
    const data = generator.valueToCode(block, 'DATA', generator.ORDER_ATOMIC) || '""';
    generator.includes_['wifi'] = '#include <WiFi.h>';
    generator.includes_['http'] = '#include <HTTPClient.h>';
    return `// HTTP POST to ${url}\nHTTPClient http;\nhttp.begin("${url}");\nhttp.addHeader("Content-Type", "application/json");\nint httpCode = http.POST(${data});\nString payload = http.getString();\nhttp.end();\n`;
};


// ==========================================
// AI BLOCK GENERATORS
// ==========================================
// AI blocks run in the browser (camera, hand, pose,
// face, speech). On Arduino they generate descriptive
// comments so the user knows what the block does.

// --- Camera AI Blocks ---


arduinoGenerator.forBlock['ai_when_detected'] = function (block, generator) {
    const className = block.getFieldValue('CLASS');
    const doCode = generator.statementToCode(block, 'DO');
    let code = `// AI: When camera detects "${className}"\n`;
    code += `{\n`;
    code += doCode || '';
    code += `}\n`;
    return code;
};

arduinoGenerator.forBlock['ai_get_prediction'] = function (block, generator) {
    return ['"ai_prediction" /* AI: current prediction */', generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['ai_get_confidence'] = function (block, generator) {
    return ['0 /* AI: prediction confidence */', generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['ai_start_prediction'] = function (block, generator) {
    return '// AI: Start camera prediction\n';
};

arduinoGenerator.forBlock['ai_stop_prediction'] = function (block, generator) {
    return '// AI: Stop camera prediction\n';
};

// --- Hand Gesture Blocks ---

arduinoGenerator.forBlock['ai_when_hand'] = function (block, generator) {
    const gesture = block.getFieldValue('GESTURE');
    const doCode = generator.statementToCode(block, 'DO');
    let code = `// AI: When hand gesture "${gesture}" detected\n`;
    code += `{\n`;
    code += doCode || '';
    code += `}\n`;
    return code;
};

arduinoGenerator.forBlock['ai_get_hand_gesture'] = function (block, generator) {
    return ['"none" /* AI: current hand gesture */', generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['ai_hand_detected'] = function (block, generator) {
    return ['false /* AI: hand detected? */', generator.ORDER_ATOMIC];
};

// --- Body Pose Blocks ---

arduinoGenerator.forBlock['ai_when_pose'] = function (block, generator) {
    const pose = block.getFieldValue('POSE');
    const doCode = generator.statementToCode(block, 'DO');
    let code = `// AI: When body pose "${pose}" detected\n`;
    code += `{\n`;
    code += doCode || '';
    code += `}\n`;
    return code;
};

arduinoGenerator.forBlock['ai_get_pose'] = function (block, generator) {
    return ['"none" /* AI: current body pose */', generator.ORDER_ATOMIC];
};

// --- Face Detection Blocks ---

arduinoGenerator.forBlock['ai_when_face'] = function (block, generator) {
    const expression = block.getFieldValue('EXPRESSION');
    const doCode = generator.statementToCode(block, 'DO');
    let code = `// AI: When face expression "${expression}" detected\n`;
    code += `{\n`;
    code += doCode || '';
    code += `}\n`;
    return code;
};

arduinoGenerator.forBlock['ai_face_detected'] = function (block, generator) {
    return ['false /* AI: face detected? */', generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['ai_get_face_expression'] = function (block, generator) {
    return ['"none" /* AI: current face expression */', generator.ORDER_ATOMIC];
};

// --- Speech Recognition Blocks ---

arduinoGenerator.forBlock['ai_when_speech'] = function (block, generator) {
    const command = block.getFieldValue('COMMAND');
    const doCode = generator.statementToCode(block, 'DO');
    let code = `// AI: When speech command "${command}" heard\n`;
    code += `{\n`;
    code += doCode || '';
    code += `}\n`;
    return code;
};

arduinoGenerator.forBlock['ai_get_speech'] = function (block, generator) {
    return ['"" /* AI: last speech command */', generator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['ai_start_listening'] = function (block, generator) {
    return '// AI: Start speech recognition\n';
};

arduinoGenerator.forBlock['ai_stop_listening'] = function (block, generator) {
    return '// AI: Stop speech recognition\n';
};

// --- AI Control Blocks ---

arduinoGenerator.forBlock['ai_control_device'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const action = block.getFieldValue('ACTION');
    const val = action === 'ON' ? 'HIGH' : 'LOW';
    return `pinMode(${pin}, OUTPUT);\ndigitalWrite(${pin}, ${val});  // AI control device ${action}\n`;
};

arduinoGenerator.forBlock['ai_control_motor'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const direction = block.getFieldValue('DIRECTION');
    const speed = block.getFieldValue('SPEED');
    return `analogWrite(${pin}, ${speed});  // AI motor ${direction}\n`;
};

arduinoGenerator.forBlock['ai_control_servo'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const angle = block.getFieldValue('ANGLE');
    const servoVar = `servo_pin${pin}`;

    generator.includes_['servo'] = '#include <ESP32Servo.h>';
    generator.variables_[servoVar] = `Servo ${servoVar};`;
    generator.setupCode_[`servo_attach_${pin}`] = `${servoVar}.attach(${pin});`;

    return `${servoVar}.write(${angle});  // AI servo to ${angle}°\n`;
};

arduinoGenerator.forBlock['ai_print_result'] = function (block, generator) {
    const msg = generator.valueToCode(block, 'MSG', generator.ORDER_ATOMIC) || '"AI result"';
    return `Serial.println(${msg});  // AI print result\n`;
};

// ==========================================
// AI Generators (Stubs)
// ==========================================
arduinoGenerator['ai_when_detected'] = function(block) { return '// AI when detected\n'; };
arduinoGenerator['ai_get_prediction'] = function(block) { return ['"prediction"', arduinoGenerator.ORDER_ATOMIC]; };
arduinoGenerator['ai_get_confidence'] = function(block) { return ['0', arduinoGenerator.ORDER_ATOMIC]; };
arduinoGenerator['ai_start_prediction'] = function(block) { return '// start prediction\n'; };
arduinoGenerator['ai_stop_prediction'] = function(block) { return '// stop prediction\n'; };

arduinoGenerator['ai_when_hand'] = function(block) { return '// AI when hand\n'; };
arduinoGenerator['ai_get_hand_gesture'] = function(block) { return ['"gesture"', arduinoGenerator.ORDER_ATOMIC]; };
arduinoGenerator['ai_hand_detected'] = function(block) { return ['false', arduinoGenerator.ORDER_ATOMIC]; };

arduinoGenerator['ai_when_pose'] = function(block) { return '// AI when pose\n'; };
arduinoGenerator['ai_get_pose'] = function(block) { return ['"pose"', arduinoGenerator.ORDER_ATOMIC]; };

arduinoGenerator['ai_when_face'] = function(block) { return '// AI when face\n'; };
arduinoGenerator['ai_face_detected'] = function(block) { return ['false', arduinoGenerator.ORDER_ATOMIC]; };
arduinoGenerator['ai_get_face_expression'] = function(block) { return ['"expression"', arduinoGenerator.ORDER_ATOMIC]; };

arduinoGenerator['ai_when_speech'] = function(block) { return '// AI when speech\n'; };
arduinoGenerator['ai_get_speech'] = function(block) { return ['"speech"', arduinoGenerator.ORDER_ATOMIC]; };
arduinoGenerator['ai_start_listening'] = function(block) { return '// start listening\n'; };
arduinoGenerator['ai_stop_listening'] = function(block) { return '// stop listening\n'; };

arduinoGenerator['ai_control_device'] = function(block) { return '// control device\n'; };
arduinoGenerator['ai_control_motor'] = function(block) { return '// control motor\n'; };
arduinoGenerator['ai_control_servo'] = function(block) { return '// control servo\n'; };
arduinoGenerator['ai_print_result'] = function(block) { return '// print AI result\n'; };
