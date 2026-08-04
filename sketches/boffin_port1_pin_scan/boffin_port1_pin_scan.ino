// Boffin/Blix ESP32 PCB - Port1 Pin Scan (Buzzer)
//
// Symptom: Code uploads OK but buzzer on Port1 (JST) doesn't beep.
// This sketch cycles through common candidate GPIOs and tries:
//   1) digital HIGH/LOW (active buzzer)
//   2) digital LOW/HIGH (active-low wiring)
//   3) LEDC PWM tone (passive buzzer)
//
// Watch Serial Monitor at 115200 to see which pin is being tested.

static const int pinsToTest[] = {
  18, 15, 19, 21, 22, 23, 25, 26, 27, 32, 33, 14, 13, 12, 2, 4, 5, 16, 17
};
static const int numPins = sizeof(pinsToTest) / sizeof(pinsToTest[0]);

static void stopToneOnPin(int pin) {
  // Stop any LEDC output; safe even if not attached
  ledcWrite(pin, 0);
  digitalWrite(pin, LOW);
}

static void testDigitalActiveHigh(int pin) {
  digitalWrite(pin, HIGH);
  delay(250);
  digitalWrite(pin, LOW);
  delay(200);
}

static void testDigitalActiveLow(int pin) {
  digitalWrite(pin, LOW);
  delay(250);
  digitalWrite(pin, HIGH);
  delay(200);
  digitalWrite(pin, LOW);
}

static void testTone(int pin, int freq) {
  ledcAttach(pin, freq, 8);
  ledcWriteTone(pin, freq);
  delay(250);
  ledcWrite(pin, 0);
  delay(200);
}

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println();
  Serial.println("=== BOFFIN Port1 Buzzer Pin Scan ===");
  Serial.println("Listen for beep while pins are tested...");

  for (int i = 0; i < numPins; i++) {
    int p = pinsToTest[i];
    pinMode(p, OUTPUT);
    digitalWrite(p, LOW);
  }
}

void loop() {
  for (int i = 0; i < numPins; i++) {
    int p = pinsToTest[i];

    Serial.print("Testing GPIO ");
    Serial.print(p);
    Serial.println(" (active-high digital)");
    testDigitalActiveHigh(p);
    testDigitalActiveHigh(p);

    Serial.print("Testing GPIO ");
    Serial.print(p);
    Serial.println(" (active-low digital)");
    testDigitalActiveLow(p);
    testDigitalActiveLow(p);

    Serial.print("Testing GPIO ");
    Serial.print(p);
    Serial.println(" (tone 1000Hz)");
    testTone(p, 1000);

    Serial.print("Testing GPIO ");
    Serial.print(p);
    Serial.println(" (tone 2000Hz)");
    testTone(p, 2000);

    stopToneOnPin(p);
    delay(300);
  }

  Serial.println("Scan complete. Restarting in 2 seconds...");
  delay(2000);
}

