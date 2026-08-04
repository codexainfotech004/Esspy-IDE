void setup() {
  Serial.begin(115200);
  pinMode(4, INPUT_PULLUP);
  pinMode(2, OUTPUT);
  pinMode(15, OUTPUT);
  ledcAttach(2, 5000, 8);
  digitalWrite(15, HIGH);
  ledcWrite(2, 200);
  delay(500);
}

void loop() {
  int val = digitalRead(4);
  Serial.print("GPIO 4 = ");
  Serial.println(val);
  delay(500);
}
