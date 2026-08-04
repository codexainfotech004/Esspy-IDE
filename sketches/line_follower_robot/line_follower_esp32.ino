/*
 * =============================================
 *  Blix Boffin Line Follower Robot — ESP32
 * =============================================
 *
 * Hardware (Blix Boffin Board):
 *   Left  IR Sensor : Port 2 — Pin A  → GPIO 2
 *   Right IR Sensor : Port 2 — Pin B  → GPIO 15
 *   Left  Motor (M1): Port 4 — PWM=GPIO27, DIR=GPIO14
 *   Right Motor (M2): Port 5 — PWM=GPIO25, DIR=GPIO26
 *
 * IR SENSOR LOGIC:
 *   Most IR sensors: HIGH (1) = Black line detected
 *                    LOW  (0) = White/no line
 *   If your robot turns the WRONG way, change LINE_STATE to LOW below.
 *
 * Motor DIRECTION:
 *   If a motor spins BACKWARDS, swap its DIR wires on the board
 *   OR change its forward state below (HIGH <-> LOW).
 * =============================================
 */

// ── Tune this if sensors are inverted ─────────────────────────────────
// HIGH = sensor outputs 1 when over black line (most common)
// LOW  = sensor outputs 0 when over black line (some modules)
#define LINE_STATE  LOW

// ── Motor speed (0–255) ───────────────────────────────────────────────
#define MOTOR_SPEED      200   // straight-ahead speed
#define TURN_SPEED       200   // outer wheel speed when turning
#define INNER_SPEED        0   // inner wheel speed when turning (0 = sharp turn)

// ── IR Sensor Pins (Port 2) ───────────────────────────────────────────
#define LEFT_IR_PIN       2   // Port 2 – Pin A
#define RIGHT_IR_PIN     15   // Port 2 – Pin B

// ── Left Motor Pins (Port 4) ──────────────────────────────────────────
#define LEFT_PWM_PIN     27   // Port 4 – Pin A (PWM / Speed)
#define LEFT_DIR_PIN     14   // Port 4 – Pin B (Direction)

// ── Right Motor Pins (Port 5) ─────────────────────────────────────────
#define RIGHT_PWM_PIN    25   // Port 5 – Pin A (PWM / Speed)
#define RIGHT_DIR_PIN    26   // Port 5 – Pin B (Direction)

// ── LEDC PWM config (ESP32) ───────────────────────────────────────────
#define PWM_FREQ        5000
#define PWM_RESOLUTION     8   // 8-bit → 0..255

// ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Serial.println("=== Blix Boffin Line Follower (ESP32) ===");

  // IR Sensor pins — plain INPUT (not PULLUP — external pull on module)
  pinMode(LEFT_IR_PIN,  INPUT);
  pinMode(RIGHT_IR_PIN, INPUT);

  // Motor direction pins
  pinMode(LEFT_DIR_PIN,  OUTPUT);
  pinMode(RIGHT_DIR_PIN, OUTPUT);
  digitalWrite(LEFT_DIR_PIN,  LOW);
  digitalWrite(RIGHT_DIR_PIN, LOW);

  // Motor PWM pins — attach LEDC channels
  pinMode(LEFT_PWM_PIN,  OUTPUT);
  pinMode(RIGHT_PWM_PIN, OUTPUT);
  ledcAttach(LEFT_PWM_PIN,  PWM_FREQ, PWM_RESOLUTION);
  ledcAttach(RIGHT_PWM_PIN, PWM_FREQ, PWM_RESOLUTION);

  // Stop both motors at start
  stopMotors();
  delay(1000); // 1-second pause before starting
  Serial.println("Starting...");
}

// ── Motor helpers ─────────────────────────────────────────────────────

void setLeftMotor(int speed) {
  // speed > 0 = forward, speed < 0 = backward, 0 = stop
  if (speed > 0) {
    digitalWrite(LEFT_DIR_PIN, HIGH);
    ledcWrite(LEFT_PWM_PIN, speed);
  } else if (speed < 0) {
    digitalWrite(LEFT_DIR_PIN, LOW);
    ledcWrite(LEFT_PWM_PIN, -speed);
  } else {
    ledcWrite(LEFT_PWM_PIN, 0);
  }
}

void setRightMotor(int speed) {
  if (speed > 0) {
    digitalWrite(RIGHT_DIR_PIN, HIGH);
    ledcWrite(RIGHT_PWM_PIN, speed);
  } else if (speed < 0) {
    digitalWrite(RIGHT_DIR_PIN, LOW);
    ledcWrite(RIGHT_PWM_PIN, -speed);
  } else {
    ledcWrite(RIGHT_PWM_PIN, 0);
  }
}

void goForward() {
  setLeftMotor(MOTOR_SPEED);
  setRightMotor(MOTOR_SPEED);
}

void turnLeft() {
  // Left sensor on line → veer left
  setLeftMotor(INNER_SPEED);
  setRightMotor(TURN_SPEED);
}

void turnRight() {
  // Right sensor on line → veer right
  setLeftMotor(TURN_SPEED);
  setRightMotor(INNER_SPEED);
}

void stopMotors() {
  setLeftMotor(0);
  setRightMotor(0);
}

// ─────────────────────────────────────────────────────────────────────
void loop() {
  int leftSensor  = digitalRead(LEFT_IR_PIN);
  int rightSensor = digitalRead(RIGHT_IR_PIN);

  bool leftOnLine  = (leftSensor  == LINE_STATE);
  bool rightOnLine = (rightSensor == LINE_STATE);

  if (leftOnLine && rightOnLine) {
    // Both on line → intersection or thick line → go straight
    Serial.println("FORWARD (both on line)");
    goForward();

  } else if (leftOnLine && !rightOnLine) {
    // Only LEFT sensor on line → line is to the left → turn LEFT
    Serial.println("TURN LEFT");
    turnLeft();

  } else if (!leftOnLine && rightOnLine) {
    // Only RIGHT sensor on line → line is to the right → turn RIGHT
    Serial.println("TURN RIGHT");
    turnRight();

  } else {
    // Neither on line → lost the line → go straight to search
    Serial.println("SEARCHING (go straight)");
    goForward();
  }

  delay(10); // 10ms loop for smooth tracking
}
