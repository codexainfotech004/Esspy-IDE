// Pin definitions
const int ledPin = 32;     // Port 4 - Pin A
const int buzzerPin = 18;  // Port 5 - Pin B

// ESP32 Tone Helper using LEDC PWM
void esp32Tone(int pin, int freq, int duration)
{
  ledcAttach(pin, freq, 8);    // Attach pin with frequency, 8-bit resolution
  ledcWriteTone(pin, freq);    // Start playing tone
  ledcWrite(pin, 127);         // Set 50% duty cycle for max volume!
  delay(duration);             // Wait for duration
  ledcWrite(pin, 0);           // Stop tone
}

void setup() {
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT);
}

void loop() {
  // Turn LED ON and play tone
  digitalWrite(ledPin, HIGH);
  esp32Tone(buzzerPin, 1000, 300); // Play 1000Hz tone for 300ms
  
  // Turn LED OFF and wait
  digitalWrite(ledPin, LOW);
  delay(500);
}
