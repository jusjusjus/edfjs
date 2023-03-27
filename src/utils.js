/**
 * @param {string|number} c - character or number
 * @returns {string} - trimmed string of character or number 
 */
export function toString(c) {
  return String(c).trim();
}

/**
 * @param {ArrayBuffer} buffer - buffer to read from
 * @param {number} start - start index
 * @param {number} end - end index
 * @returns {string} - string from buffer
 */
export function string_from_buffer(buffer, start, end) {
  const ba = new Uint8Array(buffer, start, end - start);
  return String.fromCharCode.apply(null, ba);
}

/**
 * @param {boolean} condition - condition to check
 * @param {string} msg - message to throw if condition is false
 */
export function assert(condition, msg='') {
  if (!condition) {
    throw 'Assertion Error: ' + msg;
  }
}

/**
 * @param {string} date - date string
 * @param {string} time - time string
 * @returns {Date} - date object
 */
export function parseDateTime(date, time) {
  let year, month, day, hour, minute, second, milliseconds;
  if (date.includes('-')) {
    date = date.split('-');
    year = date[0];
    month = date[1];
    day = date[2];
  } else if (date.includes('/')) {
    date = date.split('/');
    year = date[2];
    month = date[0];
    day = date[1];
  } else if (date.includes('.')) {
    date = date.split('.');
    year = date[2];
    month = date[1];
    day = date[0];
  }
  month = month - 1;
  // see EDF+ spec: 2.1.3.2
  // (https://www.edfplus.info/specs/edfplus.html#additionalspecs)
  year = year > 84 ? '19' + year: '20' + year;
  time = time.replace(/\./g, ':').split(':');
  hour = time[0];
  minute = time[1];
  second = time[2];
  milliseconds = time[3];
  if (milliseconds && milliseconds.length != 3) {
    for (let i=0; i < 3 - milliseconds.length; i++) {
      milliseconds += '0';
    }
    milliseconds = milliseconds.substring(0, 4);
  }
  return new Date(Date.UTC(year, month, day, hour, minute, second, milliseconds || 0));
}
