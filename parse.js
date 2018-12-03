/**
 * The payload variable is an array and it's global
 * You can add items, remove and edit
 */

// First, we find by temperature variable on payload(array)
const temperatureItem = payload.find(item => item.variable === 'temperature');

// If temperature variable we change the actual value from Fahrenheit to Celsius
if (temperatureItem) {
  const actualTemperatureInFahrenheit = temperatureItem.value;
  const celsius = (5 / 9) * (actualTemperatureInFahrenheit - 32);

  temperatureItem.value = celsius;
  temperatureItem.unit = 'C';
}
