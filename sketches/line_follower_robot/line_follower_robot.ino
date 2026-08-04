/*
 * Blix Boffin Line Follower Robot Sketch
 * Compatible with Boffin Controller (Arduino UNO / ESP32)
 *
 * Hardware Connections:
 * - Left IR Sensor: Digital Pin D2 (Port 1 Pin A)
 * - Right IR Sensor: Digital Pin D3 (Port 2 Pin A)
 * - Left Motor (M1): Port 4 (GPIO 27/14 or D9/D8)
 * - Right Motor (M2): Port 5 (GPIO 25/26 or D10/D12)
 */

// IR Sensor Pins
const int leftIrPin = 2;   // D2
const int rightIrPin = 3;  // D3

// Left Motor Pins (Port 4)
const int motorLeftDir = 8;
const int motorLeftPwm = 9;

// Right Motor Pins (Port 5)
const int motorRightDir = 12;
const int motorRightPwm = 10;

// Motor speed (0 - 255)
const int speedVal = 180;

void setup() {
  Serial.begin(115200);

  // Configure IR Sensors as Input
  pinMode(leftIrPin, INPUT);
  pinMode(rightIrPin, INPUT);

  // Configure Motor Pins as Output
  pinMode(motorLeftDir, OUTPUT);
  pinMode(motorLeftPwm, OUTPUT);
  pinMode(motorRightDir, OUTPUT);
  pinMode(motorRightPwm, OUTPUT);

  Serial.println("Blix Boffin Line Follower Robot Initialized.");
}

void setLeftMotor(bool forward, int speed) {
  digitalWrite(motorLeftDir, forward ? HIGH : LOW);
  analogWrite(motorLeftPwm, speed);
}

void setRightMotor(bool forward, int speed) {
  digitalWrite(motorRightDir, forward ? HIGH : LOW);
  analogWrite(motorRightPwm, speed);
}

void stopMotors() {
  analogWrite(motorLeftPwm, 0);
  analogWrite(motorRightPwm, 0);
}

void loop() {
  // Read Digital Values from IR Sensors
  // Typical IR sensor modules output HIGH (1) over Black line, LOW (0) over White surface
  int leftState = digitalRead(leftIrPin);
  int rightState = digitalRead(rightIrPin);

  if (leftState == HIGH && rightState == LOW) {
    // Left sensor detects line -> Turn Left
    Serial.println("Turn Left");
    setLeftMotor(true, 0);
    setRightMotor(true, speedVal);
  }
  else if (rightState == HIGH && leftState == LOW) {
    // Right sensor detects line -> Turn Right
    Serial.println("Turn Right");
    setLeftMotor(true, speedVal);
    setRightMotor(true, 0);
  }
  else if (leftState == LOW && rightState == LOW) {
    // Neither detects line -> Move Forward
    Serial.println("Move Forward");
    setLeftMotor(true, speedVal);
    setRightMotor(true, speedVal);
  }
  else {
    // Both detect line (Intersection or stop mark) -> Stop Motors
    Serial.println("Stop / Intersection");
    stopMotors();
  }

  delay(20); // Short delay for loop stability
}
