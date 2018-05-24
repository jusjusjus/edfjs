
var toString = function(c) {
  return String(c).trim();
}

var string_from_buffer = function(buffer, start, end) {
  var ba = new Uint8Array(buffer, start, end-start);
  return String.fromCharCode.apply(null, ba);
}

var assert = function(condition, msg) {
  if (!condition) {
    throw "Assertion Error: "+msg;
  }
}


var parseDateTime = function(date, time, century='20') {
  var year, month, day, hour, minute, second, milliseconds;
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
  month = +month-1;
  if (year.length == 2) {
    year = century+year;
  }
  time = time.replace(/\./g, ':').split(':');
  hour = time[0];
  minute = time[1];
  second = time[2];
  milliseconds = time[3];
  if (milliseconds && milliseconds.length != 3) {
    for (var i=0; i<3-milliseconds.length; i++) {
      milliseconds += '0';
    }
    milliseconds = milliseconds.substring(0, 4);
  }
  return new Date(Date.UTC(year, month, day, hour, minute, second, milliseconds || 0));
}

var Channel = function (self={}) {
  self.fields = {
    label:    		          [toString, 16],
    channel_type:        	  [toString, 80],
    physical_dimension:     [toString, 8],
    physical_minimum:	      [Number, 8],
    physical_maximum:	      [Number, 8],
    digital_minimum:        [Number, 8],
    digital_maximum:        [Number, 8],
    prefiltering:           [toString, 80],
    num_samples_per_record: [Number, 8],
    reserved:               [toString, 32]
  };
  scale = null;
  offset = null;
  sampling_rate = null;

  var digital2physical = function (d) {
    return scale*(d+offset);
  }

  var init = function (num_records, record_duration) {
    if (self.num_samples_per_record == null) {
      console.log("Error: allocate_blob called on uninitialized channel.");
      return null;
    }
    self.blob = new Float32Array(num_records*self.num_samples_per_record);
    scale = (this.physical_maximum - this.physical_minimum) /
                 (this.digital_maximum  - this.digital_minimum);
    offset = this.physical_maximum / scale - this.digital_maximum;
    sampling_rate = self.num_samples_per_record/record_duration;
  }

  var set_record = function (record, digi) {
    var start = record*self.num_samples_per_record;
    for (var i=0; i<self.num_samples_per_record; i++) {
      self.blob[start+i] = digital2physical(digi[i]);
    }
  }

  var get_physical_samples = function (t0, dt) {
    var start = t0*sampling_rate;
    var end = dt*sampling_rate;
    return self.blob.slice(start, start+end);
  }

  self.set_record = set_record;
  self.get_physical_samples = get_physical_samples;
  self.digital2physical = digital2physical;
  self.init = init;
  self.sampling_rate = function () { return sampling_rate; };

  return self;
}

var EDF = function (self={}) {
  self.fields = {
    version:    		 [toString, 8],
    pid:        		 [toString, 80],
    rid:        		 [toString, 80],
    startdate:	     [toString, 8],
    starttime:	     [toString, 8],
    num_header_bytes:[Number, 8],
    reserved:        [toString, 44],
    num_records:     [Number, 8],
    record_duration: [Number, 8],
    num_channels:    [Number, 4]
  };
  header_bytes = 256;
  bytes_per_sample = 2;

  var onload_handler = function(evt, callback, header_only) {
    read_buffer(evt.target.result, header_only);
    callback(evt);
  }

  var read_header_from_string = function (string) {
    var start = 0;
    for (var name in self.fields) {
      var type = self.fields[name][0];
      var end = start + self.fields[name][1];
      self[name] = type(string.substring(start, end));
      start = end;
    }
    self.startdatetime = parseDateTime(self.startdate, self.starttime);
  }

  var read_channel_header_from_string = function (string) {
    self.channels = [];
    for (var c=0; c<self.num_channels; c++) {
      self.channels.push(Channel());
    }
    var start = 0;
    var channel_fields = self.channels[0].fields;
    for (var name in channel_fields) {
      var type = channel_fields[name][0];
      var len = channel_fields[name][1];
      for (var c=0; c<self.num_channels; c++) {
        var end = start + len;
        self.channels[c][name] = type(string.substring(start, end));
        start = end;
      }
    }
  }

  var check_blob_size = function(buffer) {
    var samples_per_record = 0;
    for (var c=0; c<self.num_channels; c++) {
      samples_per_record += self.channels[c].num_samples_per_record;
    }
    var expected_samples = samples_per_record*self.num_records;
    var samples_in_blob = (buffer.byteLength-self.num_header_bytes)/2;
    self.duration = self.record_duration * samples_in_blob/samples_per_record;
    assert(samples_in_blob == expected_samples, "Header implies "+expected_samples+" samples; "+samples_in_blob+" found.");
    return samples_in_blob;
  }

  var read_blob_from_buffer = function (buffer) {
    var record_channel_map = [0];
    for (var c=0; c<self.num_channels; c++) {
      record_channel_map.push(
        record_channel_map[c] + self.channels[c].num_samples_per_record);
    }
    samples_per_record = record_channel_map[self.channels.length];
    try {
      var samples_in_blob = check_blob_size(buffer);
    } catch(err) {
      console.error(err);
      var samples_in_blob = (buffer.byteLength-self.num_header_bytes)/2;
    }
    var blob = new Int16Array(buffer, self.num_header_bytes, samples_in_blob);
    for (var c=0; c<self.num_channels; c++) {
      self.channels[c].init(self.num_records, self.record_duration);
    }
    for (r=0; r<self.num_records; r++) {
      for (var c=0; c<self.num_channels; c++) {
        self.channels[c].set_record(r,
          blob.slice(
            r*samples_per_record + record_channel_map[c],
            r*samples_per_record + record_channel_map[c+1]
          )
        );
      }
    }
  }

  var read_buffer = function (buffer, header_only=false) {
    // header
    var str = string_from_buffer(buffer, 0, header_bytes);
    read_header_from_string(str);
    if (self.num_channels == 0) {
      return null;
    }
    // channels
    str = string_from_buffer(buffer, header_bytes, self.num_header_bytes);
    read_channel_header_from_string(str);
    check_blob_size(buffer);
    // blob
    if(header_only == false) {
      read_blob_from_buffer(buffer);
    }
  }

	var from_file = function (file, callback, header_only=false) {
		var reader = new FileReader();
    self.filename = file.name;
		reader.onload = function (evt) { onload_handler(evt, callback, header_only); };
		reader.readAsArrayBuffer(file);
	}

  self.from_file = from_file;
  return self;
};
