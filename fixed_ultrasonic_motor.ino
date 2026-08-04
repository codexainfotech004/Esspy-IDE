// === Helper Functions ===

// Read distance from HC-SR04 (Trig: 4, Echo: 0)
float readUltrasonic_4_0() {
  digitalWrite(4, LOW);
  delayMicroseconds(2);
  digitalWrite(4, HIGH);
  delayMicroseconds(10);
  digitalWrite(4, LOW);
  long duration = pulseIn(0, HIGH, 30000);  // 30ms timeout
  float distance = duration * 0.034 / 2.0;  // Speed of sound = 0.034 cm/μs
  if (distance == 0 || distance > 400) return 999;  // Out of range
  return distance;
}

// === Setup (runs once at startup) ===
void setup() {
  Serial.begin(115200);

  // Ultrasonic sensor pins
  pinMode(4, OUTPUT);  // Trigger
  pinMode(0, INPUT);   // Echo

  // Motor on PORT2 — configure once
  pinMode(2, OUTPUT);
  pinMode(15, OUTPUT);
  ledcAttach(2, 5000, 8);
  digitalWrite(15, HIGH);  // Direction = forward
  ledcWrite(2, 200);       // Start moving

  Serial.println("System Started");
}

// === Loop (runs continuously) ===
void loop() {
  float dist = readUltrasonic_4_0();

  if (dist <= 10) {
    // Object too close → STOP motor
    ledcWrite(2, 0);
    digitalWrite(15, LOW);
    Serial.println("Object Detected");
  } else {
    // Clear path → RUN motor forward
    digitalWrite(15, HIGH);
    ledcWrite(2, 200);
  }
}
