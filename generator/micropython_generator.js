/**
 * =============================================
 * BharatBlocks IDE - MicroPython Code Generator
 * =============================================
 * 
 * Converts Blockly workspace blocks into valid MicroPython
 * code for ESP32 boards.
 * 
 * Supported devices:
 *   - LED, Digital/Analog I/O
 *   - Servo Motor (PWM-based)
 *   - Ultrasonic Sensor HC-SR04
 *   - IR Sensor (digital)
 *   - Buzzer (PWM tone)
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
// Initialize MicroPython Code Generator
// ==========================================
const micropythonGenerator = new Blockly.Generator('MicroPython');

// Operator precedence levels
micropythonGenerator.ORDER_ATOMIC = 0;
micropythonGenerator.ORDER_UNARY_PREFIX = 1;
micropythonGenerator.ORDER_MULTIPLICATIVE = 2;
micropythonGenerator.ORDER_ADDITIVE = 3;
micropythonGenerator.ORDER_RELATIONAL = 4;
micropythonGenerator.ORDER_EQUALITY = 5;
micropythonGenerator.ORDER_LOGICAL_AND = 6;
micropythonGenerator.ORDER_LOGICAL_OR = 7;
micropythonGenerator.ORDER_ASSIGNMENT = 8;
micropythonGenerator.ORDER_NONE = 99;

// ==========================================
// Generator Configuration
// ==========================================
micropythonGenerator.INDENT = '    ';
micropythonGenerator.imports_ = {};
micropythonGenerator.setupCode_ = {};
micropythonGenerator.variables_ = {};
micropythonGenerator.functions_ = {};

micropythonGenerator.init = function (workspace) {
    this.imports_ = {};
    this.setupCode_ = {};
    this.variables_ = {};
    this.functions_ = {};
    // Use new Blockly v12 API to avoid deprecation warning
    if (!this.nameDB_) {
        this.nameDB_ = new Blockly.Names(Blockly.Names.DEVELOPER_VARIABLE_PREFIX || '');
    }
    this.nameDB_.setVariableMap(workspace.getVariableMap());
};

micropythonGenerator.finish = function (code) {
    // Collect imports
    let importCode = '';
    for (let key in this.imports_) {
        importCode += this.imports_[key] + '\n';
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
    if (importCode) finalCode += '# === Imports ===\n' + importCode + '\n';
    if (varCode) finalCode += '# === Variables ===\n' + varCode + '\n';
    if (funcCode) finalCode += '# === Helper Functions ===\n' + funcCode + '\n';
    finalCode += code;

    return finalCode;
};

micropythonGenerator.scrubNakedValue = function (line) {
    return line + '\n';
};

micropythonGenerator.scrub_ = function (block, code, thisOnly) {
    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    if (nextBlock && !thisOnly) {
        return code + micropythonGenerator.blockToCode(nextBlock);
    }
    return code;
};


// ==========================================
// BASIC BLOCK GENERATORS
// ==========================================

micropythonGenerator.forBlock['start_program'] = function (block, generator) {
    const setupCode = generator.statementToCode(block, 'SETUP');
    const loopCode = generator.statementToCode(block, 'LOOP');

    // Collect auto-generated setup code
    let autoSetup = '';
    for (let key in generator.setupCode_) {
        autoSetup += generator.setupCode_[key] + '\n';
    }

    let code = '# === Setup (runs once) ===\n';
    if (autoSetup) code += autoSetup;
    if (setupCode) code += setupCode;
    code += '\n';
    code += '# === Loop (runs continuously) ===\n';
    code += 'while True:\n';
    if (loopCode) {
        code += loopCode;
    } else {
        code += '    pass\n';
    }

    return code;
};

micropythonGenerator.forBlock['delay_ms'] = function (block) {
    const ms = block.getFieldValue('MS');
    return `time.sleep_ms(${ms})\n`;
};

micropythonGenerator.forBlock['serial_print'] = function (block, generator) {
    const msg = generator.valueToCode(block, 'MSG', generator.ORDER_ATOMIC) || '""';
    return `print(${msg})\n`;
};

micropythonGenerator.forBlock['text_value'] = function (block, generator) {
    const text = block.getFieldValue('TEXT');
    return [JSON.stringify(text), generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['comment_block'] = function (block) {
    const text = String(block.getFieldValue('TEXT') || '').replace(/\r?\n/g, ' ');
    return `# ${text.replace(/^\s*\/\/\s?/, '')}\n`;
};

micropythonGenerator.forBlock['run_once'] = function (block, generator) {
    return generator.statementToCode(block, 'DO');
};

micropythonGenerator.forBlock['break_loop'] = function () {
    return 'break\n';
};

micropythonGenerator.forBlock['continue_loop'] = function () {
    return 'continue\n';
};


// ==========================================
// ESP32 / GPIO BLOCK GENERATORS
// ==========================================

micropythonGenerator.forBlock['led_on'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.imports_['time'] = 'import time';
    let code = `Pin(${pin}, Pin.OUT).value(1)  # LED ON\n`;
    return code;
};

micropythonGenerator.forBlock['led_off'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    let code = `Pin(${pin}, Pin.OUT).value(0)  # LED OFF\n`;
    return code;
};

micropythonGenerator.forBlock['led_blink'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const delay = block.getFieldValue('DELAY');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.imports_['time'] = 'import time';
    let code = `led_${pin} = Pin(${pin}, Pin.OUT)\n`;
    code += `led_${pin}.value(1)  # LED ON\n`;
    code += `time.sleep_ms(${delay})\n`;
    code += `led_${pin}.value(0)  # LED OFF\n`;
    code += `time.sleep_ms(${delay})\n`;
    return code;
};

micropythonGenerator.forBlock['digital_write'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const state = block.getFieldValue('STATE');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    const val = state === 'HIGH' ? '1' : '0';
    return `Pin(${pin}, Pin.OUT).value(${val})\n`;
};

micropythonGenerator.forBlock['digital_read'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    return [`Pin(${pin}, Pin.IN).value()`, generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['analog_read'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.variables_[`adc_${pin}`] = `adc_${pin} = ADC(Pin(${pin}))`;
    return [`adc_${pin}.read()`, generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['analog_write'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const value = block.getFieldValue('VALUE');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    return `PWM(Pin(${pin}), duty=${value})  # PWM output\n`;
};

micropythonGenerator.forBlock['pin_mode'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const mode = block.getFieldValue('MODE');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    const pyMode = mode === 'OUTPUT' ? 'Pin.OUT' : 'Pin.IN';
    return `Pin(${pin}, ${pyMode})\n`;
};


// ==========================================
// SERVO BLOCK GENERATORS
// ==========================================

micropythonGenerator.forBlock['servo_control'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const angle = block.getFieldValue('ANGLE');

    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.imports_['time'] = 'import time';

    // Helper function for servo control using duty_u16 (16-bit: 0-65535)
    // 50Hz servo: 0.5ms = ~1638, 2.5ms = ~8192 out of 65535
    generator.functions_['servo_write'] = `
# Servo control using PWM (duty_u16 for ESP32)
_servo_pwms = {}
def servo_write(pin_num, angle):
    if pin_num not in _servo_pwms:
        _servo_pwms[pin_num] = PWM(Pin(pin_num), freq=50)
    # Map angle (0-180) to duty_u16 (1638-8192 for 0.5ms-2.5ms pulse at 50Hz)
    min_duty = 1638
    max_duty = 8192
    duty = int(min_duty + (angle / 180) * (max_duty - min_duty))
    _servo_pwms[pin_num].duty_u16(duty)
    time.sleep_ms(20)
`;

    let code = `servo_write(${pin}, ${angle})  # Set servo to ${angle}°\n`;
    return code;
};

micropythonGenerator.forBlock['servo_sweep'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const from = block.getFieldValue('FROM');
    const to = block.getFieldValue('TO');
    const speed = block.getFieldValue('SPEED');

    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.imports_['time'] = 'import time';

    generator.functions_['servo_write'] = `
# Servo control using PWM (duty_u16 for ESP32)
_servo_pwms = {}
def servo_write(pin_num, angle):
    if pin_num not in _servo_pwms:
        _servo_pwms[pin_num] = PWM(Pin(pin_num), freq=50)
    min_duty = 1638
    max_duty = 8192
    duty = int(min_duty + (angle / 180) * (max_duty - min_duty))
    _servo_pwms[pin_num].duty_u16(duty)
    time.sleep_ms(20)
`;

    let code = `# Sweep servo from ${from}° to ${to}°\n`;
    if (from <= to) {
        code += `for angle in range(${from}, ${to} + 1):\n`;
    } else {
        code += `for angle in range(${from}, ${to} - 1, -1):\n`;
    }
    code += `    servo_write(${pin}, angle)\n`;
    code += `    time.sleep_ms(${speed})\n`;
    return code;
};

micropythonGenerator.forBlock['servo_attach'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.variables_[`servo_${pin}`] = `servo_${pin} = PWM(Pin(${pin}), freq=50)`;
    return `# Servo attached to pin ${pin}\n`;
};

micropythonGenerator.forBlock['servo_detach'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.variables_[`servo_${pin}`] = `servo_${pin} = PWM(Pin(${pin}), freq=50)`;
    return `servo_${pin}.deinit()  # Detach servo from pin ${pin}\n`;
};


// ==========================================
// ULTRASONIC SENSOR (HC-SR04) GENERATORS
// ==========================================

micropythonGenerator.forBlock['ultrasonic_setup'] = function (block, generator) {
    const trig = block.getFieldValue('TRIG');
    const echo = block.getFieldValue('ECHO');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.imports_['time'] = 'import time';

    let code = `# Ultrasonic sensor setup\n`;
    code += `trig_${trig} = Pin(${trig}, Pin.OUT)\n`;
    code += `echo_${echo} = Pin(${echo}, Pin.IN)\n`;
    return code;
};

micropythonGenerator.forBlock['ultrasonic_read'] = function (block, generator) {
    const trig = block.getFieldValue('TRIG');
    const echo = block.getFieldValue('ECHO');

    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.imports_['time'] = 'import time';
    generator.imports_['time2'] = 'import time as utime';

    generator.functions_[`ultrasonic_${trig}_${echo}`] = `
# Read distance from HC-SR04 (Trig: ${trig}, Echo: ${echo})
def read_ultrasonic_${trig}_${echo}():
    trig = Pin(${trig}, Pin.OUT)
    echo = Pin(${echo}, Pin.IN)
    trig.value(0)
    time.sleep_us(2)
    trig.value(1)
    time.sleep_us(10)
    trig.value(0)
    while echo.value() == 0:
        start = time.ticks_us()
    while echo.value() == 1:
        end = time.ticks_us()
    duration = time.ticks_diff(end, start)
    distance = duration * 0.034 / 2
    if distance == 0 or distance > 400:
        return -1
    return distance
`;

    return [`read_ultrasonic_${trig}_${echo}()`, generator.ORDER_ATOMIC];
};


// ==========================================
// IR SENSOR GENERATORS
// ==========================================

micropythonGenerator.forBlock['ir_read'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    return [`Pin(${pin}, Pin.IN).value()  # IR sensor`, generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['ir_detected'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    return [`(Pin(${pin}, Pin.IN).value() == 0)  # IR obstacle`, generator.ORDER_EQUALITY];
};

micropythonGenerator.forBlock['ir_line_detected'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    return [`(Pin(${pin}, Pin.IN).value() == 0)  # IR line`, generator.ORDER_EQUALITY];
};


// ==========================================
// BUZZER BLOCK GENERATORS
// ==========================================

micropythonGenerator.forBlock['buzzer_on'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.imports_['time'] = 'import time';

    // Use PWM at 1kHz so passive buzzers also produce sound
    generator.functions_['buzzer_start'] = `
# Start buzzer using PWM (works with both active & passive buzzers)
_buzzer_pwm = {}
def buzzer_start(pin_num, freq=1000):
    if pin_num in _buzzer_pwm:
        _buzzer_pwm[pin_num].deinit()
    _buzzer_pwm[pin_num] = PWM(Pin(pin_num), freq=freq, duty_u16=32768)
`;

    generator.functions_['buzzer_stop'] = `
# Stop buzzer and release PWM
def buzzer_stop(pin_num):
    if pin_num in _buzzer_pwm:
        _buzzer_pwm[pin_num].deinit()
        del _buzzer_pwm[pin_num]
    Pin(pin_num, Pin.OUT).value(0)
`;

    return `buzzer_start(${pin})  # Buzzer ON (1kHz tone)\n`;
};

micropythonGenerator.forBlock['buzzer_off'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';

    generator.functions_['buzzer_stop'] = `
# Stop buzzer and release PWM
def buzzer_stop(pin_num):
    if pin_num in _buzzer_pwm:
        _buzzer_pwm[pin_num].deinit()
        del _buzzer_pwm[pin_num]
    Pin(pin_num, Pin.OUT).value(0)
`;

    return `buzzer_stop(${pin})  # Buzzer OFF\n`;
};

micropythonGenerator.forBlock['buzzer_tone'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const freq = block.getFieldValue('FREQ');
    const dur = block.getFieldValue('DUR');

    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.imports_['time'] = 'import time';

    // duty_u16=32768 is 50% duty cycle (max volume for buzzer)
    generator.functions_['play_tone'] = `
# Play tone using ESP32 PWM (duty_u16 for better compatibility)
def play_tone(pin_num, freq, duration_ms):
    buzzer = PWM(Pin(pin_num), freq=freq, duty_u16=32768)
    time.sleep_ms(duration_ms)
    buzzer.deinit()
    Pin(pin_num, Pin.OUT).value(0)
`;

    return `play_tone(${pin}, ${freq}, ${dur})  # Play ${freq}Hz for ${dur}ms\n`;
};

micropythonGenerator.forBlock['buzzer_note'] = function (block, generator) {
    const note = block.getFieldValue('NOTE');
    const pin = block.getFieldValue('PIN');
    const dur = block.getFieldValue('DUR');

    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.imports_['time'] = 'import time';

    // duty_u16=32768 is 50% duty cycle (max volume for buzzer)
    generator.functions_['play_tone'] = `
# Play tone using ESP32 PWM (duty_u16 for better compatibility)
def play_tone(pin_num, freq, duration_ms):
    buzzer = PWM(Pin(pin_num), freq=freq, duty_u16=32768)
    time.sleep_ms(duration_ms)
    buzzer.deinit()
    Pin(pin_num, Pin.OUT).value(0)
`;

    return `play_tone(${pin}, ${note}, ${dur})  # Play musical note\ntime.sleep_ms(50)  # Gap between notes\n`;
};

micropythonGenerator.forBlock['buzzer_notone'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';

    generator.functions_['buzzer_stop'] = `
# Stop buzzer and release PWM
def buzzer_stop(pin_num):
    if pin_num in _buzzer_pwm:
        _buzzer_pwm[pin_num].deinit()
        del _buzzer_pwm[pin_num]
    Pin(pin_num, Pin.OUT).value(0)
`;

    return `buzzer_stop(${pin})  # Stop tone\n`;
};


// ==========================================
// RELAY BLOCK GENERATORS
// ==========================================

micropythonGenerator.forBlock['relay_on'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    return `Pin(${pin}, Pin.OUT).value(0)  # Relay ON (active-low)\n`;
};

micropythonGenerator.forBlock['relay_off'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    return `Pin(${pin}, Pin.OUT).value(1)  # Relay OFF (active-low)\n`;
};

micropythonGenerator.forBlock['relay_toggle'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.variables_[`relay_${pin}`] = `relay_${pin} = Pin(${pin}, Pin.OUT)`;
    return `relay_${pin}.value(0 if relay_${pin}.value() else 1)  # Toggle relay\n`;
};


// ==========================================
// DC MOTOR BLOCK GENERATORS (L298N/L293D)
// ==========================================

micropythonGenerator.forBlock['motor_forward'] = function (block, generator) {
    const port = block.getFieldValue('PORT');
    const speed = block.getFieldValue('SPEED');

    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';

    // Port to GPIO Mappings (PWM = pinA, DIR = pinB)
    const portPins = {
        "PORT1": { dir: 7, pwm: 8 },
        "PORT2": { dir: 15, pwm: 2 },
        "PORT3": { dir: 0, pwm: 4 },
        "PORT4": { dir: 14, pwm: 27 },
        "PORT5": { dir: 26, pwm: 25 },
        "PORT6": { dir: 32, pwm: 33 },
        "PORT7": { dir: 12, pwm: 13 },
        "PORT8": { dir: 9, pwm: 10 }
    };
    const pins = portPins[port] || portPins["PORT1"];

    let code = `# Motor Forward on ${port}\n`;
    code += `Pin(${pins.dir}, Pin.OUT).value(1)\n`;
    code += `PWM(Pin(${pins.pwm}), duty=${speed})\n`;
    return code;
};

micropythonGenerator.forBlock['motor_backward'] = function (block, generator) {
    const port = block.getFieldValue('PORT');
    const speed = block.getFieldValue('SPEED');

    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';

    // Port to GPIO Mappings (PWM = pinA, DIR = pinB)
    const portPins = {
        "PORT1": { dir: 7, pwm: 8 },
        "PORT2": { dir: 15, pwm: 2 },
        "PORT3": { dir: 0, pwm: 4 },
        "PORT4": { dir: 14, pwm: 27 },
        "PORT5": { dir: 26, pwm: 25 },
        "PORT6": { dir: 32, pwm: 33 },
        "PORT7": { dir: 12, pwm: 13 },
        "PORT8": { dir: 9, pwm: 10 }
    };
    const pins = portPins[port] || portPins["PORT1"];

    let code = `# Motor Backward on ${port}\n`;
    code += `Pin(${pins.dir}, Pin.OUT).value(0)\n`;
    code += `PWM(Pin(${pins.pwm}), duty=${speed})\n`;
    return code;
};

micropythonGenerator.forBlock['motor_stop'] = function (block, generator) {
    const port = block.getFieldValue('PORT');

    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';

    // Port to GPIO Mappings (PWM = pinA, DIR = pinB)
    const portPins = {
        "PORT1": { dir: 7, pwm: 8 },
        "PORT2": { dir: 15, pwm: 2 },
        "PORT3": { dir: 0, pwm: 4 },
        "PORT4": { dir: 14, pwm: 27 },
        "PORT5": { dir: 26, pwm: 25 },
        "PORT6": { dir: 32, pwm: 33 },
        "PORT7": { dir: 12, pwm: 13 },
        "PORT8": { dir: 9, pwm: 10 }
    };
    const pins = portPins[port] || portPins["PORT1"];

    let code = `# Motor Stop on ${port}\n`;
    code += `Pin(${pins.dir}, Pin.OUT).value(0)\n`;
    code += `PWM(Pin(${pins.pwm}), duty=0)\n`;
    return code;
};


// ==========================================
// DHT SENSOR GENERATORS (DHT11 / DHT22)
// ==========================================

micropythonGenerator.forBlock['dht_setup'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const type = block.getFieldValue('TYPE');

    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.imports_['dht'] = 'import dht';

    const dhtClass = type === 'DHT22' ? 'dht.DHT22' : 'dht.DHT11';
    generator.variables_[`dht_${pin}`] = `dht_${pin} = ${dhtClass}(Pin(${pin}))`;

    return `# DHT sensor initialized on pin ${pin}\n`;
};

micropythonGenerator.forBlock['dht_read_temp'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');

    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.imports_['dht'] = 'import dht';

    generator.functions_[`read_temp_${pin}`] = `
def read_temp_${pin}():
    dht_${pin}.measure()
    return dht_${pin}.temperature()
`;

    return [`read_temp_${pin}()`, generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['dht_read_humidity'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');

    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.imports_['dht'] = 'import dht';

    generator.functions_[`read_humidity_${pin}`] = `
def read_humidity_${pin}():
    dht_${pin}.measure()
    return dht_${pin}.humidity()
`;

    return [`read_humidity_${pin}()`, generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['dht_heat_index'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.imports_['dht'] = 'import dht';

    generator.functions_[`heat_index_${pin}`] = `
def heat_index_${pin}():
    dht_${pin}.measure()
    t = dht_${pin}.temperature()
    h = dht_${pin}.humidity()
    return (-8.78469475556 + 1.61139411 * t + 2.33854883889 * h
            - 0.14611605 * t * h - 0.012308094 * t * t
            - 0.0164248277778 * h * h + 0.002211732 * t * t * h
            + 0.00072546 * t * h * h - 0.000003582 * t * t * h * h)
`;

    return [`heat_index_${pin}()`, generator.ORDER_ATOMIC];
};


// ==========================================
// ESP32 TOUCH SENSOR GENERATORS
// ==========================================

micropythonGenerator.forBlock['touch_read'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    return [`TouchPad(Pin(${pin})).read()`, generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['touch_detected'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const threshold = block.getFieldValue('THRESHOLD');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    return [`(TouchPad(Pin(${pin})).read() < ${threshold})`, generator.ORDER_RELATIONAL];
};


// ==========================================
// LCD DISPLAY GENERATORS (I2C)
// ==========================================

micropythonGenerator.forBlock['lcd_setup'] = function (block, generator) {
    const addr = block.getFieldValue('ADDR');

    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.imports_['i2c'] = 'from machine import I2C, SoftI2C';
    generator.imports_['lcd_lib'] = 'from lcd_i2c import LCD';

    let code = `i2c = SoftI2C(scl=Pin(22), sda=Pin(21))\n`;
    code += `lcd = LCD(addr=${addr}, cols=16, rows=2, i2c=i2c)\n`;
    code += `lcd.begin()\n`;
    return code;
};

micropythonGenerator.forBlock['lcd_print'] = function (block, generator) {
    const text = generator.valueToCode(block, 'TEXT', generator.ORDER_ATOMIC) || '""';
    const row = block.getFieldValue('ROW');
    const col = block.getFieldValue('COL');

    return `lcd.set_cursor(${col}, ${row})\nlcd.print(${text})\n`;
};

micropythonGenerator.forBlock['lcd_clear'] = function () {
    return `lcd.clear()\n`;
};


// ==========================================
// LOGIC BLOCK GENERATORS
// ==========================================

micropythonGenerator.forBlock['if_condition'] = function (block, generator) {
    const condition = generator.valueToCode(block, 'CONDITION', generator.ORDER_NONE) || 'True';
    const doCode = generator.statementToCode(block, 'DO');
    const elseCode = generator.statementToCode(block, 'ELSE');

    let code = `if ${condition}:\n`;
    code += doCode || '    pass\n';
    if (elseCode) {
        code += `else:\n`;
        code += elseCode;
    }
    return code;
};

micropythonGenerator.forBlock['comparison'] = function (block, generator) {
    const opMap = { 'EQ': '==', 'NEQ': '!=', 'LT': '<', 'GT': '>', 'LTE': '<=', 'GTE': '>=' };
    const op = opMap[block.getFieldValue('OP')];
    const a = generator.valueToCode(block, 'A', generator.ORDER_RELATIONAL) || '0';
    const b = generator.valueToCode(block, 'B', generator.ORDER_RELATIONAL) || '0';
    return [`(${a} ${op} ${b})`, generator.ORDER_RELATIONAL];
};

micropythonGenerator.forBlock['boolean_value'] = function (block, generator) {
    const val = block.getFieldValue('BOOL');
    return [val === 'TRUE' ? 'True' : 'False', generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['logic_operation'] = function (block, generator) {
    const opMap = { 'AND': 'and', 'OR': 'or' };
    const op = opMap[block.getFieldValue('OP')];
    const order = op === 'and' ? generator.ORDER_LOGICAL_AND : generator.ORDER_LOGICAL_OR;
    const a = generator.valueToCode(block, 'A', order) || 'False';
    const b = generator.valueToCode(block, 'B', order) || 'False';
    return [`(${a} ${op} ${b})`, order];
};

micropythonGenerator.forBlock['logic_not'] = function (block, generator) {
    const value = generator.valueToCode(block, 'VALUE', generator.ORDER_UNARY_PREFIX) || 'True';
    return [`not ${value}`, generator.ORDER_UNARY_PREFIX];
};


// ==========================================
// LOOP BLOCK GENERATORS
// ==========================================

micropythonGenerator.forBlock['repeat_times'] = function (block, generator) {
    const times = block.getFieldValue('TIMES');
    const doCode = generator.statementToCode(block, 'DO');
    let code = `for _ in range(${times}):\n`;
    code += doCode || '    pass\n';
    return code;
};

micropythonGenerator.forBlock['forever_loop'] = function (block, generator) {
    const doCode = generator.statementToCode(block, 'DO');
    return `while True:\n${doCode || '    pass\n'}`;
};

micropythonGenerator.forBlock['while_loop'] = function (block, generator) {
    const condition = generator.valueToCode(block, 'CONDITION', generator.ORDER_NONE) || 'True';
    const doCode = generator.statementToCode(block, 'DO');
    return `while ${condition}:\n${doCode || '    pass\n'}`;
};

micropythonGenerator.forBlock['for_loop'] = function (block, generator) {
    const varName = block.getFieldValue('VAR') || 'i';
    const from = Number(block.getFieldValue('FROM'));
    const to = Number(block.getFieldValue('TO'));
    const rawStep = Number(block.getFieldValue('STEP'));
    const step = rawStep === 0 ? 1 : rawStep;
    const stop = step > 0 ? to + 1 : to - 1;
    const doCode = generator.statementToCode(block, 'DO');
    return `for ${varName} in range(${from}, ${stop}, ${step}):\n${doCode || '    pass\n'}`;
};


// ==========================================
// VARIABLE BLOCK GENERATORS
// ==========================================

micropythonGenerator.forBlock['set_variable'] = function (block, generator) {
    const varName = block.getFieldValue('VAR');
    const value = generator.valueToCode(block, 'VALUE', generator.ORDER_ASSIGNMENT) || '0';
    return `${varName} = ${value}\n`;
};

micropythonGenerator.forBlock['get_variable'] = function (block, generator) {
    return [block.getFieldValue('VAR'), generator.ORDER_ATOMIC];
};


// ==========================================
// MATH BLOCK GENERATORS
// ==========================================

micropythonGenerator.forBlock['math_number_value'] = function (block, generator) {
    return [String(block.getFieldValue('NUM')), generator.ORDER_ATOMIC];
};
micropythonGenerator.forBlock['math_number'] = micropythonGenerator.forBlock['math_number_value'];

micropythonGenerator.forBlock['math_operation'] = function (block, generator) {
    const opMap = {
        'ADD': '+',
        'MINUS': '-', 'SUB': '-',
        'MULTIPLY': '*', 'MUL': '*',
        'DIVIDE': '/', 'DIV': '/',
        'MODULO': '%', 'MOD': '%'
    };
    const op = opMap[block.getFieldValue('OP')];
    const order = (op === '*' || op === '/' || op === '%')
        ? generator.ORDER_MULTIPLICATIVE : generator.ORDER_ADDITIVE;
    const a = generator.valueToCode(block, 'A', order) || '0';
    const b = generator.valueToCode(block, 'B', order) || '0';
    return [`(${a} ${op} ${b})`, order];
};

micropythonGenerator.forBlock['map_value'] = function (block, generator) {
    const value = generator.valueToCode(block, 'VALUE', generator.ORDER_ATOMIC) || '0';
    const fromLow = block.getFieldValue('IN_MIN');
    const fromHigh = block.getFieldValue('IN_MAX');
    const toLow = block.getFieldValue('OUT_MIN');
    const toHigh = block.getFieldValue('OUT_MAX');

    generator.functions_['map_value'] = `
# Map value from one range to another
def map_value(x, in_min, in_max, out_min, out_max):
    return int((x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min)
`;

    return [`map_value(${value}, ${fromLow}, ${fromHigh}, ${toLow}, ${toHigh})`, generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['math_random'] = function (block, generator) {
    const min = block.getFieldValue('MIN');
    const max = block.getFieldValue('MAX');
    generator.imports_['random'] = 'import random';
    return [`random.randint(${min}, ${max})`, generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['math_min'] = function (block, generator) {
    const a = generator.valueToCode(block, 'A', generator.ORDER_NONE) || '0';
    const b = generator.valueToCode(block, 'B', generator.ORDER_NONE) || '0';
    return [`min(${a}, ${b})`, generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['math_max'] = function (block, generator) {
    const a = generator.valueToCode(block, 'A', generator.ORDER_NONE) || '0';
    const b = generator.valueToCode(block, 'B', generator.ORDER_NONE) || '0';
    return [`max(${a}, ${b})`, generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['math_abs'] = function (block, generator) {
    const value = generator.valueToCode(block, 'NUM', generator.ORDER_NONE) || '0';
    return [`abs(${value})`, generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['math_round'] = function (block, generator) {
    const value = generator.valueToCode(block, 'NUM', generator.ORDER_NONE) || '0';
    return [`round(${value})`, generator.ORDER_ATOMIC];
};

for (const [blockType, functionName] of [
    ['math_floor', 'floor'],
    ['math_ceil', 'ceil'],
    ['math_sqrt', 'sqrt'],
]) {
    micropythonGenerator.forBlock[blockType] = function (block, generator) {
        const value = generator.valueToCode(block, 'NUM', generator.ORDER_NONE) || '0';
        generator.imports_['math'] = 'import math';
        return [`math.${functionName}(${value})`, generator.ORDER_ATOMIC];
    };
}

micropythonGenerator.forBlock['math_pow'] = function (block, generator) {
    const base = generator.valueToCode(block, 'BASE', generator.ORDER_NONE) || '0';
    const exponent = generator.valueToCode(block, 'EXP', generator.ORDER_NONE) || '0';
    return [`pow(${base}, ${exponent})`, generator.ORDER_ATOMIC];
};

for (const [blockType, functionName] of [
    ['math_sin', 'sin'],
    ['math_cos', 'cos'],
    ['math_tan', 'tan'],
]) {
    micropythonGenerator.forBlock[blockType] = function (block, generator) {
        const degrees = generator.valueToCode(block, 'DEG', generator.ORDER_NONE) || '0';
        generator.imports_['math'] = 'import math';
        return [`math.${functionName}(math.radians(${degrees}))`, generator.ORDER_ATOMIC];
    };
}

micropythonGenerator.forBlock['code_snippet'] = function (block) {
    const code = block.getFieldValue('CODE');
    return `${code}\n`;
};


// ==========================================
// SOIL MOISTURE SENSOR GENERATORS
// ==========================================

micropythonGenerator.forBlock['soil_read'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.variables_[`adc_soil_${pin}`] = `adc_soil_${pin} = ADC(Pin(${pin}))`;
    return [`adc_soil_${pin}.read()  # Soil moisture`, generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['soil_is_dry'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const threshold = block.getFieldValue('THRESHOLD');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.variables_[`adc_soil_${pin}`] = `adc_soil_${pin} = ADC(Pin(${pin}))`;
    return [`(adc_soil_${pin}.read() > ${threshold})  # Soil is dry?`, generator.ORDER_RELATIONAL];
};


// ==========================================
// SOUND SENSOR GENERATORS
// ==========================================

micropythonGenerator.forBlock['sound_read'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.variables_[`adc_sound_${pin}`] = `adc_sound_${pin} = ADC(Pin(${pin}))`;
    return [`adc_sound_${pin}.read()  # Sound level`, generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['sound_detected'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const threshold = block.getFieldValue('THRESHOLD');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.variables_[`adc_sound_${pin}`] = `adc_sound_${pin} = ADC(Pin(${pin}))`;
    return [`(adc_sound_${pin}.read() > ${threshold})  # Sound detected?`, generator.ORDER_RELATIONAL];
};

micropythonGenerator.forBlock['sound_clap_detected'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const threshold = block.getFieldValue('THRESHOLD');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.variables_[`adc_sound_${pin}`] = `adc_sound_${pin} = ADC(Pin(${pin}))`;
    return [`(adc_sound_${pin}.read() > ${threshold})  # Clap detected?`, generator.ORDER_RELATIONAL];
};


// ==========================================
// IR RECEIVER GENERATORS (Remote Control)
// ==========================================

micropythonGenerator.forBlock['ir_receive_setup'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.imports_['time'] = 'import time';

    generator.functions_['ir_nec_recv'] = `
# Simple NEC IR receiver
_ir_pin = None
_ir_last_code = 0

def ir_setup(pin_num):
    global _ir_pin
    _ir_pin = Pin(pin_num, Pin.IN)

def ir_read():
    global _ir_last_code
    if _ir_pin is None:
        return 0
    # Simple pulse-based IR reading
    if _ir_pin.value() == 0:
        # Signal detected - read pulse timing
        pulses = []
        for i in range(32):
            while _ir_pin.value() == 0:
                pass
            t1 = time.ticks_us()
            while _ir_pin.value() == 1:
                pass
            t2 = time.ticks_us()
            pulses.append(time.ticks_diff(t2, t1))
        # Decode pulses to value
        code = 0
        for p in pulses:
            code = (code << 1) | (1 if p > 1000 else 0)
        _ir_last_code = code
        return code
    return 0
`;

    return `ir_setup(${pin})  # IR Receiver on pin ${pin}\n`;
};

micropythonGenerator.forBlock['ir_receive_code'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.imports_['time'] = 'import time';
    return [`ir_read()  # Read IR code`, generator.ORDER_ATOMIC];
};


// ==========================================
// JOYSTICK MODULE GENERATORS
// ==========================================

micropythonGenerator.forBlock['joystick_read_x'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.variables_[`adc_jx_${pin}`] = `adc_jx_${pin} = ADC(Pin(${pin}))`;
    return [`adc_jx_${pin}.read()  # Joystick X`, generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['joystick_read_y'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.variables_[`adc_jy_${pin}`] = `adc_jy_${pin} = ADC(Pin(${pin}))`;
    return [`adc_jy_${pin}.read()  # Joystick Y`, generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['joystick_button'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    return [`(Pin(${pin}, Pin.IN, Pin.PULL_UP).value() == 0)  # Joystick button`, generator.ORDER_EQUALITY];
};


// ==========================================
// ROTARY ENCODER GENERATORS
// ==========================================

micropythonGenerator.forBlock['encoder_setup'] = function (block, generator) {
    const clk = block.getFieldValue('CLK');
    const dt = block.getFieldValue('DT');
    const sw = block.getFieldValue('SW');

    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';

    generator.variables_['encoder'] = `enc_clk = Pin(${clk}, Pin.IN, Pin.PULL_UP)\nenc_dt = Pin(${dt}, Pin.IN, Pin.PULL_UP)\nenc_sw = Pin(${sw}, Pin.IN, Pin.PULL_UP)\nencoder_pos = 0\n_enc_last_clk = enc_clk.value()`;

    generator.functions_['encoder_update'] = `
# Update encoder position (call in loop)
def update_encoder():
    global encoder_pos, _enc_last_clk
    current_clk = enc_clk.value()
    if current_clk != _enc_last_clk and current_clk == 0:
        if enc_dt.value() != current_clk:
            encoder_pos += 1
        else:
            encoder_pos -= 1
    _enc_last_clk = current_clk
`;

    return `# Rotary encoder initialized (CLK:${clk}, DT:${dt}, SW:${sw})\n`;
};

micropythonGenerator.forBlock['encoder_read_position'] = function (block, generator) {
    return [`encoder_pos  # Encoder position`, generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['encoder_button'] = function (block, generator) {
    const sw = block.getFieldValue('SW');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    return [`(Pin(${sw}, Pin.IN, Pin.PULL_UP).value() == 0)  # Encoder button`, generator.ORDER_EQUALITY];
};


// ==========================================
// PUSH BUTTON GENERATOR
// ==========================================

micropythonGenerator.forBlock['button_pressed'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    return [`(Pin(${pin}, Pin.IN, Pin.PULL_UP).value() == 0)  # Button pressed`, generator.ORDER_EQUALITY];
};

micropythonGenerator.forBlock['button_released'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    return [`(Pin(${pin}, Pin.IN, Pin.PULL_UP).value() == 1)  # Button released`, generator.ORDER_EQUALITY];
};

micropythonGenerator.forBlock['button_long_press'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const duration = block.getFieldValue('DURATION');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    return [`(Pin(${pin}, Pin.IN, Pin.PULL_UP).value() == 0)  # Long press (${duration}ms)`, generator.ORDER_EQUALITY];
};


// ==========================================
// WIFI GENERATORS (ESP32 / ESP8266)
// ==========================================

micropythonGenerator.forBlock['wifi_connect'] = function (block, generator) {
    const ssid = block.getFieldValue('SSID');
    const pass = block.getFieldValue('PASS');

    generator.imports_['network'] = 'import network';
    generator.imports_['time'] = 'import time';
    generator.variables_['wifi_sta'] = `sta_if = network.WLAN(network.STA_IF)`;

    let code = `# Connect to WiFi\n`;
    code += `sta_if.active(True)\n`;
    code += `sta_if.connect("${ssid}", "${pass}")\n`;
    code += `print("Connecting to WiFi", end="")\n`;
    code += `while not sta_if.isconnected():\n`;
    code += `    time.sleep_ms(500)\n`;
    code += `    print(".", end="")\n`;
    code += `print("\\nConnected! IP:", sta_if.ifconfig()[0])\n`;
    return code;
};

micropythonGenerator.forBlock['wifi_get_ip'] = function (block, generator) {
    generator.imports_['network'] = 'import network';
    generator.variables_['wifi_sta'] = `sta_if = network.WLAN(network.STA_IF)`;
    return [`sta_if.ifconfig()[0]  # IP Address`, generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['wifi_is_connected'] = function (block, generator) {
    generator.imports_['network'] = 'import network';
    generator.variables_['wifi_sta'] = `sta_if = network.WLAN(network.STA_IF)`;
    return [`sta_if.isconnected()  # WiFi connected?`, generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['wifi_disconnect'] = function (block, generator) {
    generator.imports_['network'] = 'import network';
    generator.variables_['wifi_sta'] = `sta_if = network.WLAN(network.STA_IF)`;
    return 'sta_if.disconnect()\nsta_if.active(False)\n';
};

micropythonGenerator.forBlock['wifi_http_get'] = function (block, generator) {
    const url = JSON.stringify(block.getFieldValue('URL') || '');
    generator.imports_['urequests'] = 'import urequests';
    generator.functions_['http_get'] = `
def http_get(url):
    response = urequests.get(url)
    try:
        return response.text
    finally:
        response.close()
`;
    return [`http_get(${url})`, generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['wifi_http_post'] = function (block, generator) {
    const url = JSON.stringify(block.getFieldValue('URL') || '');
    const data = generator.valueToCode(block, 'DATA', generator.ORDER_NONE) || '""';
    generator.imports_['urequests'] = 'import urequests';
    generator.functions_['http_post'] = `
def http_post(url, data):
    response = urequests.post(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        return response.text
    finally:
        response.close()
`;
    return [`http_post(${url}, ${data})`, generator.ORDER_ATOMIC];
};


// ==========================================
// AI BLOCK GENERATORS
// ==========================================
// AI blocks run in the browser (camera, hand, pose,
// face, speech). On ESP32 they generate descriptive
// comments so the user knows what the block does.

// --- Camera AI Blocks ---

micropythonGenerator.forBlock['ai_when_detected'] = function (block, generator) {
    const className = block.getFieldValue('CLASS');
    const doCode = generator.statementToCode(block, 'DO');
    let code = `# AI: When camera detects "${className}":\n`;
    code += doCode || '    pass\n';
    return code;
};

micropythonGenerator.forBlock['ai_get_prediction'] = function (block, generator) {
    return ['"ai_prediction"  # AI: current prediction', generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['ai_get_confidence'] = function (block, generator) {
    return ['0  # AI: prediction confidence', generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['ai_start_prediction'] = function (block, generator) {
    return '# AI: Start camera prediction\n';
};

micropythonGenerator.forBlock['ai_stop_prediction'] = function (block, generator) {
    return '# AI: Stop camera prediction\n';
};

// --- Hand Gesture Blocks ---

micropythonGenerator.forBlock['ai_when_hand'] = function (block, generator) {
    const gesture = block.getFieldValue('GESTURE');
    const doCode = generator.statementToCode(block, 'DO');
    let code = `# AI: When hand gesture "${gesture}" detected:\n`;
    code += doCode || '    pass\n';
    return code;
};

micropythonGenerator.forBlock['ai_get_hand_gesture'] = function (block, generator) {
    return ['"none"  # AI: current hand gesture', generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['ai_hand_detected'] = function (block, generator) {
    return ['False  # AI: hand detected?', generator.ORDER_ATOMIC];
};

// --- Body Pose Blocks ---

micropythonGenerator.forBlock['ai_when_pose'] = function (block, generator) {
    const pose = block.getFieldValue('POSE');
    const doCode = generator.statementToCode(block, 'DO');
    let code = `# AI: When body pose "${pose}" detected:\n`;
    code += doCode || '    pass\n';
    return code;
};

micropythonGenerator.forBlock['ai_get_pose'] = function (block, generator) {
    return ['"none"  # AI: current body pose', generator.ORDER_ATOMIC];
};

// --- Face Detection Blocks ---

micropythonGenerator.forBlock['ai_when_face'] = function (block, generator) {
    const expression = block.getFieldValue('EXPRESSION');
    const doCode = generator.statementToCode(block, 'DO');
    let code = `# AI: When face expression "${expression}" detected:\n`;
    code += doCode || '    pass\n';
    return code;
};

micropythonGenerator.forBlock['ai_face_detected'] = function (block, generator) {
    return ['False  # AI: face detected?', generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['ai_get_face_expression'] = function (block, generator) {
    return ['"none"  # AI: current face expression', generator.ORDER_ATOMIC];
};

// --- Speech Recognition Blocks ---

micropythonGenerator.forBlock['ai_when_speech'] = function (block, generator) {
    const command = block.getFieldValue('COMMAND');
    const doCode = generator.statementToCode(block, 'DO');
    let code = `# AI: When speech command "${command}" heard:\n`;
    code += doCode || '    pass\n';
    return code;
};

micropythonGenerator.forBlock['ai_get_speech'] = function (block, generator) {
    return ['""  # AI: last speech command', generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['ai_start_listening'] = function (block, generator) {
    return '# AI: Start speech recognition\n';
};

micropythonGenerator.forBlock['ai_stop_listening'] = function (block, generator) {
    return '# AI: Stop speech recognition\n';
};

// --- AI Control Blocks ---

micropythonGenerator.forBlock['ai_control_device'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const action = block.getFieldValue('ACTION');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    const val = action === 'ON' ? '1' : '0';
    return `Pin(${pin}, Pin.OUT).value(${val})  # AI control device ${action}\n`;
};

micropythonGenerator.forBlock['ai_control_motor'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const direction = block.getFieldValue('DIRECTION');
    const speed = block.getFieldValue('SPEED');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    return `PWM(Pin(${pin}), duty=${speed})  # AI motor ${direction}\n`;
};

micropythonGenerator.forBlock['ai_control_servo'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const angle = block.getFieldValue('ANGLE');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.imports_['time'] = 'import time';

    generator.functions_['servo_write'] = `
# Servo control using PWM (duty_u16 for ESP32)
_servo_pwms = {}
def servo_write(pin_num, angle):
    if pin_num not in _servo_pwms:
        _servo_pwms[pin_num] = PWM(Pin(pin_num), freq=50)
    min_duty = 1638
    max_duty = 8192
    duty = int(min_duty + (angle / 180) * (max_duty - min_duty))
    _servo_pwms[pin_num].duty_u16(duty)
    time.sleep_ms(20)
`;

    return `servo_write(${pin}, ${angle})  # AI servo to ${angle}°\n`;
};

micropythonGenerator.forBlock['ai_print_result'] = function (block, generator) {
    const msg = generator.valueToCode(block, 'MSG', generator.ORDER_ATOMIC) || '"AI result"';
    return `print(${msg})  # AI print result\n`;
};

// ==========================================
// AI Generators (Stubs)
// ==========================================
micropythonGenerator['ai_when_detected'] = function(block) { return '// AI when detected\n'; };
micropythonGenerator['ai_get_prediction'] = function(block) { return ['"prediction"', micropythonGenerator.ORDER_ATOMIC]; };
micropythonGenerator['ai_get_confidence'] = function(block) { return ['0', micropythonGenerator.ORDER_ATOMIC]; };
micropythonGenerator['ai_start_prediction'] = function(block) { return '// start prediction\n'; };
micropythonGenerator['ai_stop_prediction'] = function(block) { return '// stop prediction\n'; };

micropythonGenerator['ai_when_hand'] = function(block) { return '// AI when hand\n'; };
micropythonGenerator['ai_get_hand_gesture'] = function(block) { return ['"gesture"', micropythonGenerator.ORDER_ATOMIC]; };
micropythonGenerator['ai_hand_detected'] = function(block) { return ['False', micropythonGenerator.ORDER_ATOMIC]; };

micropythonGenerator['ai_when_pose'] = function(block) { return '// AI when pose\n'; };
micropythonGenerator['ai_get_pose'] = function(block) { return ['"pose"', micropythonGenerator.ORDER_ATOMIC]; };

micropythonGenerator['ai_when_face'] = function(block) { return '// AI when face\n'; };
micropythonGenerator['ai_face_detected'] = function(block) { return ['False', micropythonGenerator.ORDER_ATOMIC]; };
micropythonGenerator['ai_get_face_expression'] = function(block) { return ['"expression"', micropythonGenerator.ORDER_ATOMIC]; };

micropythonGenerator['ai_when_speech'] = function(block) { return '// AI when speech\n'; };
micropythonGenerator['ai_get_speech'] = function(block) { return ['"speech"', micropythonGenerator.ORDER_ATOMIC]; };
micropythonGenerator['ai_start_listening'] = function(block) { return '// start listening\n'; };
micropythonGenerator['ai_stop_listening'] = function(block) { return '// stop listening\n'; };

micropythonGenerator['ai_control_device'] = function(block) { return '// control device\n'; };
micropythonGenerator['ai_control_motor'] = function(block) { return '// control motor\n'; };
micropythonGenerator['ai_control_servo'] = function(block) { return '// control servo\n'; };
micropythonGenerator['ai_print_result'] = function(block) { return '// print AI result\n'; };


// ==========================================
// ELECTROMAGNET & MAGNETIC SENSOR GENERATORS
// ==========================================

micropythonGenerator.forBlock['electromagnet_on'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    return `Pin(${pin}, Pin.OUT).value(1)  # Electromagnet ON\n`;
};

micropythonGenerator.forBlock['electromagnet_off'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    return `Pin(${pin}, Pin.OUT).value(0)  # Electromagnet OFF\n`;
};

micropythonGenerator.forBlock['magnetic_sensor_read'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.variables_[`adc_mag_${pin}`] = `adc_mag_${pin} = ADC(Pin(${pin}))`;
    return [`adc_mag_${pin}.read()  # Magnetic sensor reading`, generator.ORDER_ATOMIC];
};

micropythonGenerator.forBlock['magnetic_sensor_detected'] = function (block, generator) {
    const pin = block.getFieldValue('PIN');
    const threshold = block.getFieldValue('THRESHOLD');
    generator.imports_['machine'] = 'from machine import Pin, PWM, ADC, TouchPad';
    generator.variables_[`adc_mag_${pin}`] = `adc_mag_${pin} = ADC(Pin(${pin}))`;
    return [`(adc_mag_${pin}.read() > ${threshold})  # Magnet detected?`, generator.ORDER_RELATIONAL];
};
