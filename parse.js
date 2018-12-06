/**
 * This code finds the variable temperature inside the payload posted by the device,
 * converts the value from Fahrenheit to Celsius, 
 * and changes its value to Celsius, and adds the unit
 * To test this code, make sure your device posts the variable "temperature" 
 */

// First, we find the temperature variable inside the payload(array)
const temperatureItem = payload.find(item => item.variable === 'temperature');

// If we find temperature variable, we convert the value from Fahrenheit to Celsius
if (temperatureItem) {
  const actualTemperatureInFahrenheit = temperatureItem.value;
  const celsius = (5 / 9) * (actualTemperatureInFahrenheit - 32);

  // Then, we output the value and unit.
  temperatureItem.value = celsius;
  temperatureItem.unit = 'C';
}
