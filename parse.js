/* This is an example code for TTN Parser.
** TTN send several parameters to TagoIO. The job of this parse is to convert all these parameters into a TagoIO format.
** One of these parameters is the payload of your device. We find it too and apply the appropriate sensor parse.
**
** IMPORTANT: In most case, you will only need to edit the parsePayload function.
**
** Testing:
** You can do manual tests to this parse by using the Device Emulator. Copy and Paste the following code:
** [{ "variable": "ttn_payload", "value": "{ \"payload_raw\": \"0109611395\" }" }]
**
** The ignore_vars variable in this code should be used to ignore variables
** from the device that you don't want.
*/
// Add ignorable variables in this array.
const ignore_vars = ['rf_chain', 'channel', 'modulation', 'app_id', 'dev_id', 'time', 'gtw_trusted', 'port'];


/**
 * Convert an object to TagoIO object format.
 * Can be used in two ways:
 * toTagoFormat({ myvariable: myvalue , anothervariable: anothervalue... })
 * toTagoFormat({ myvariable: { value: myvalue, unit: 'C', metadata: { color: 'green' }} , anothervariable: anothervalue... })
 *
 * @param {Object} object_item Object containing key and value.
 * @param {String} serie Serie for the variables
 * @param {String} prefix Add a prefix to the variables name
 */
function toTagoFormat(object_item, serie, prefix = '') {
  const result = [];
  for (const key in object_item) {
    if (ignore_vars.includes(key)) continue;

    if (typeof object_item[key] == 'object') {
      result.push({
        variable: object_item[key].variable || `${prefix}${key}`,
        value: object_item[key].value,
        serie: object_item[key].serie || serie,
        metadata: object_item[key].metadata,
        location: object_item[key].location,
        unit: object_item[key].unit,
      });
    } else {
      result.push({
        variable: `${prefix}${key}`,
        value: object_item[key],
        serie,
      });
    }
  }

  return result;
}

// Just convert lat and lng, or latitude and longitude to TagoIO format.
function transformLatLngToLocation(fields, serie, prefix = '') {
  if ((fields.latitude && fields.longitude) || (fields.lat && fields.lng)) {
    const lat = fields.lat || fields.latitude;
    const lng = fields.lng || fields.longitude;

    // Change to TagoIO format.
    // Using variable "location".
    const variable = {
      variable: `${prefix}location`,
      value: `${lat}, ${lng}`,
      location: { lat, lng },
      serie,
    };

    delete fields.latitude; // remove latitude so it's not parsed later
    delete fields.longitude; // remove latitude so it's not parsed later
    delete fields.lat; // remove latitude so it's not parsed later
    delete fields.lng; // remove latitude so it's not parsed later

    return variable;
  }
}

function parsePayloadFields(payload_fields, serie) {
  let result = [];

  // Check for latitude and longitude fields. Work with lat and lng too.
  const location = transformLatLngToLocation(payload_fields, serie);
  if (location) result.push(location);

  result = result.concat(toTagoFormat(payload_fields, serie));
  return result;
}

function parseGatewayFields(metadata, default_serie) {
  if (!metadata.gateways) return []; // If gateway fields doesn't exist, just ignore the metadata.
  let result = [];

  // Get only the Gateway fields
  for (const item of metadata.gateways) {
    // create a unique serie for each gateway.
    const serie = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); 

    const location = transformLatLngToLocation(item, serie, 'gtw_');
    if (location) result.push(location);

    result = result.concat(toTagoFormat(item, serie));
  }
  delete metadata.gateways;

  result = result.concat(toTagoFormat(metadata, default_serie));

  return result;
}

/**
 * This is the main function to parse the payload. Everything else doesn't require your attention.
 * @param {String} payload_raw 
 * @returns {Object} containing key and value to TagoIO
 */
function parsePayload(payload_raw) {
  // If your device is sending something different than hex, like base64, just specify it bellow.
  const buffer = Buffer.from(payload_raw, 'hex');

  // Lets say you have a payload of 3 bytes.
  // 0 - Protocol Version
  // 1,2 - Temperature
  // 3,4 - Humidity
  // More information about buffers can be found here: https://nodejs.org/api/buffer.html
  const data = {
    protocol_version: buffer.slice(0,1).readInt8(),
    temperature: { value: buffer.slice(1,3).readInt16BE() / 100, unit: '°C' },
    humidity: { value: buffer.slice(3,5).readUInt16BE() / 100, unit: '%' },
  };
  
  return data;
}

// Check if what is being stored is the ttn_payload.
// Payload is an environment variable. Is where what is being inserted to your device comes in.
// Payload always is an array of objects. [ { variable, value...}, {variable, value...} ...]
var ttn_payload = payload.find(x => x.variable === 'ttn_payload');
if (ttn_payload) {
  // Get a unique serie for the incoming data.
  const serie = ttn_payload.serie || new Date().getTime();
 
  // Parse the ttn_payload to JSON format (it comes in a String format)
  ttn_payload = JSON.parse(ttn_payload.value);
  const raw_payload = ttn_payload.payload || ttn_payload.payload_raw;
  if (raw_payload) {
    // Parse the payload from your sensor to function parsePayload
    try {
      payload = toTagoFormat(parsePayload(raw_payload), serie);
    } catch (e) {
      // Catch any error in the parse code and send to parse_error variable.
      payload = payload.concat({ variable: 'parse_error', value: e.message || e });
    }
  }

  // Parse the payload_fields. Go to parsePayloadFields function if you need to change something.
  if (ttn_payload.payload_fields) {
    payload = payload.concat(parsePayloadFields(ttn_payload.payload_fields, serie));
    delete ttn_payload.payload_fields; // remove, so it's not parsed again later.
  }

  // Parse the gateway fields,
  if (ttn_payload.metadata) {
    payload = payload.concat(parseGatewayFields(ttn_payload.metadata, serie));
  }
}
