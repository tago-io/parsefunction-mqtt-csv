/* This is an generic payload parser example.
** The code find the payload variable and parse it if exists.
**
** IMPORTANT: In most case, you will only need to edit the parsePayload function.
**
** Testing:
** You can do manual tests to this parse by using the Device Emulator. Copy and Paste the following code:
** [{ "variable": "payload", "value": "0109611395" }]
**
** The ignore_vars variable in this code should be used to ignore variables
** from the device that you don't want.
*/
// Add ignorable variables in this array.
const ignore_vars = [];

/**
 * This is the main function to parse the payload. Everything else doesn't require your attention.
 * @param {String} payload_raw 
 * @returns {Object} containing key and value to TagoIO
 */
function parsePayload(payload_raw) {
  try {
    // If your device is sending something different than hex, like base64, just specify it bellow.
    const buffer = Buffer.from(payload_raw, 'hex');

    // Lets say you have a payload of 3 bytes.
    // 0 - Protocol Version
    // 1,2 - Temperature
    // 3,4 - Humidity
    // More information about buffers can be found here: https://nodejs.org/api/buffer.html
    const data = [
      { variable: 'protocol_version', value: buffer.readInt8(0) },
      { variable: 'temperature',  value: buffer.readInt16BE(1) / 100, unit: '°C' },
      { variable: 'humidity',  value: buffer.readUInt16BE(3) / 100, unit: '%' },
    ];
    return data;

  } catch (e) {
    // Return the variable parse_error for debugging.
    return [{ variable: 'parse_error', value: e.message }];
  }
}

// Remove unwanted variables.
payload = payload.filter(x => !ignore_vars.includes(x.variable));

// Payload is an environment variable. Is where what is being inserted to your device comes in.
// Payload always is an array of objects. [ { variable, value...}, {variable, value...} ...]
const payload_raw = payload.find(x => x.variable === 'payload_raw' || x.variable === 'payload' || x.variable === 'data');
if (payload_raw) {
  // Get a unique serie for the incoming data.
  const { value, serie, time } = payload_raw;

  // Parse the payload_raw to JSON format (it comes in a String format)
  if (value) {
    payload = parsePayload(value).map(x => ({ ...x, serie, time: x.time || time }));;
  }
}
