void setup() {
  Serial.begin(115200);
  pinMode(13, OUTPUT);
  pinMode(4, INPUT_PULLUP);
  Serial.println("system started");
}

void loop() {
  if (digitalRead(4) == LOW) {
    digitalWrite(13, HIGH);
    Serial.println("motion detected");
  } else {
    digitalWrite(13, LOW);
  }
}
