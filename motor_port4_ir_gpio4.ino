void setup() {
  Serial.begin(115200);
  pinMode(27, OUTPUT);
  pinMode(14, OUTPUT);
  ledcAttach(27, 5000, 8);
  pinMode(4, INPUT_PULLUP);
  digitalWrite(14, HIGH);
  ledcWrite(27, 200);
  Serial.println("system started");
}

void loop() {
  if (digitalRead(4) == LOW) {
    digitalWrite(14, LOW);
    ledcWrite(27, 0);
    Serial.println("object detected");
  } else {
    digitalWrite(14, HIGH);
    ledcWrite(27, 200);
  }
}
