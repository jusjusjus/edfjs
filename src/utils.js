/**
 * @param {string|number} c - character or number
 * @returns {string} - trimmed string of character or number 
 */
export function toString(c) {
  return String(c).trim();
}

/** returns Array of annotations from buffer
 *
 * Each annotation contains onset and label, and optionally duration.
 * Separator between adjacent annots is '20'.  Separator between onset and
 * duration is '21' if available.
 *
 * @param {Uint8Array} buffer - buffer to read from
 * @return {{onset: number, label: string, duration: number}[]} - annotations
 */
export function parseAnnotations(buffer) {
  const annotations = [];
  let start = 0;
  let current = null;
  let lastWas20 = false;
  for(let end = 0; end < buffer.length; end++) {
    const value = buffer[end];
    const closeString = value === 20; // \x**\x14
    const closeAnnotation = lastWas20 && (value === 0); // \x14\x00

    if (closeString) {
      const slice = buffer.slice(start, end);
      if (!current) {
        current = {
          label: [],
          ...parseStartDuration(slice),
        };
      } else {
        current.label.push(bufferToString(slice));
      }
      lastWas20 = true;
      start = end + 1;
    } else if (closeAnnotation) {
      start += 1;
      annotations.push(current);
      current = null;
    }
    lastWas20 = closeString;
  }
  return annotations;
}

/**
 * returns onset and duration if there's 21, else onset
 * @param {string} input - input buffer
 * @return {{onset: number, duration: number}} - onset and duration
 */
function parseStartDuration(buffer) {
  const bufferToInt = (b) => Number(bufferToString(b));
  for (let end = 0; end < buffer.length; end++) {
    if (buffer[end] === 21) {
      return {
        onset: bufferToInt(buffer.slice(0, end)),
        duration: bufferToInt(buffer.slice(end + 1, buffer.length))
      };
    }
  }
  return {
    onset: bufferToInt(buffer),
    duration: 0,
  };
}

/**
 * returns string from buffer
 *
 * @param {Uint8Array} x - buffer to convert to string
 * @returns {string} - string from buffer
 * @private
 */
function bufferToString(x) {
  const string = Buffer.from(x.buffer).toString();
  return string.replace(/\0/g, '');
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
