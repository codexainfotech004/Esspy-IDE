// Boffin/Blix ESP32 PCB - Interactive Pin Scanner
// Tests one pin at a time and waits for user input to continue.

static const int pinsToTest[] = {
  14, 13, 12, 2, 4, 5, 16, 17
};
static const int numPins = sizeof(pinsToTest) / sizeof(pinsToTest[0]);
int currentPinIndex = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== INTERACTIVE Pin Scanner ===");
  Serial.println("Send any character to test the next pin.");
  
  for (int i = 0; i < numPins; i++) {
    pinMode(pinsToTest[i], OUTPUT);
    digitalWrite(pinsToTest[i], LOW);
  }
}

void loop() {
  if (currentPinIndex >= numPins) {
    Serial.println("Scan complete! Send any character to restart from the beginning.");
    while (Serial.available() == 0);
    Serial.read();
    currentPinIndex = 0;
  }

  int p = pinsToTest[currentPinIndex];
  Serial.print("\nREADY to test GPIO ");
  Serial.print(p);
  Serial.println(". Send any character to START test...");

  // Wait for user input
  while (Serial.available() == 0);
  while (Serial.available() > 0) Serial.read(); // Clear buffer

  Serial.print("TESTING GPIO ");
  Serial.print(p);
  Serial.println("...");

  // 1. Digital High/Low
  digitalWrite(p, HIGH);
  delay(500);
  digitalWrite(p, LOW);
  delay(200);

  // 2. Tone
  ledcAttach(p, 1000, 8);
  ledcWriteTone(p, 1000);
  delay(500);
  ledcWrite(p, 0);
  
  Serial.print("Done testing GPIO ");
  Serial.print(p);
  Serial.println(". Did it beep?");
  
  currentPinIndex++;
}
