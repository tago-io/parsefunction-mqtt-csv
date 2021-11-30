/* This is a generic payload parser that can be used as a starting point MQTT devices
** The code expects to receive comma separated data, and not JSON formatted data.
**
** Testing:
** Testing:
** You can do manual tests to the parse by using the Device Emulator. Copy and Paste the following JSON:
** [{ "variable": "payload", "value": "temp,12,hum,50", "metadata": { "mqtt_topic": "data" } } ]
*/

// Prevents the code from running for other types data insertions.
// We search for a variable name payload or a variable with metadata.mqtt_topic
const mqtt_payload = payload.find((data) => data.variable === "payload" || (data.metadata && data.metadata.mqtt_topic));
if (mqtt_payload) {
  // Split the content by the separator , 
  const splitted_value = mqtt_payload.value.split(',');
  // splitted_value content will be ['temp', '12', 'hum', '50']
  // index starts from 0

 // Normalize the data to TagoIO format.
 // We use Number function to cast number values, so we can use it on chart widgets, etc.
  const data = [
    { variable: 'temperature',  value: Number(splitted_value[1]), unit: '°C' },
    { variable: 'humidity',  value: Number(splitted_value[3]), unit: '%' },
  ];

  // This will concat the content sent by your device with the content generated in this payload parser.
  // It also adds the field "serie" to be able to group in tables and other widgets.
  const serie = String(new Date().getTime());
  payload = payload.concat(data).map(x => ({ ...x, serie }));
}
