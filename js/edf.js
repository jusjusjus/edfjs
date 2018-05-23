
var toString = function(c) {
  return String(c).trim();
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
    if (this.num_samples_per_record == null) {
      console.log("Error: allocate_blob called on uninitialized channel.");
      return null;
    }
    this.blob = new Float32Array(num_records*this.num_samples_per_record);
    scale = (this.physical_maximum - this.physical_minimum) /
                 (this.digital_maximum  - this.digital_minimum);
    offset = this.physical_maximum / scale - this.digital_maximum;
    sampling_rate = this.num_samples_per_record/record_duration;
  }

  var set_record = function (record, digi) {
    var start = record*this.num_samples_per_record;
    for (var i=0; i<this.num_samples_per_record; i++) {
      this.blob[start+i] = digital2physical(digi[i]);
    }
  }

  var get_physical_samples = function (t0, dt) {
    var start = t0*sampling_rate;
    var end = dt*sampling_rate;
    return this.blob.slice(start, start+end);
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

  var cumsum = function(x) {
    var c = [x[0]];
    for (var i=1; i<x.length; i++) {
      c.push(c[i-1]+x[i]);
    }
    return c;
  }

  var onload_handler = function(evt, callback, header_only) {
    read_buffer(evt.target.result, header_only);
    callback(evt);
  }

  var read_buffer = function (buffer, header_only=false) {
    // header
    var headerBytes = new Uint8Array(buffer, 0, header_bytes);
    var str = String.fromCharCode.apply(null, headerBytes);
    start = 0;
    for (var name in self.fields) {
      var type = self.fields[name][0];
      var len = self.fields[name][1];
      end = start + len;
      self[name] = type(str.substring(start, end));
      start = end;
    }
    if (self.num_channels == 0) {
      return null;
    }
    // channels
    var channelBytes = new Uint8Array(buffer, header_bytes,
                                      self.num_header_bytes-header_bytes);
    str = String.fromCharCode.apply(null, channelBytes);
    self.channels = [];
    for (var c=0; c<self.num_channels; c++) {
      self.channels.push(Channel());
    }
    start = 0;
    var channel_fields = self.channels[0].fields;
    for (var name in channel_fields) {
      var type = channel_fields[name][0];
      var len = channel_fields[name][1];
      for (var c=0; c<self.num_channels; c++) {
        end = start + len;
        self.channels[c][name] = type(str.substring(start, end));
        start = end;
      }
    }
    if(header_only) {
      return null;
    }
    // blob
    var bytes_per_sample = 2;
    var bytes_by_channel = []
    for (var c=0; c<self.num_channels; c++) {
      bytes_by_channel.push(bytes_per_sample * self.channels[c].num_samples_per_record);
    }
    var channel_bytes_map = cumsum(bytes_by_channel)
    var bytes_per_record = channel_bytes_map[self.num_channels-1];
    var blob = new Int16Array(buffer, num_header_bytes,
                              (buffer.byteLength-num_header_bytes)/2);
    for (var c=0; c<self.num_channels; c++) {
      self.channels[c].init(self.num_records, self.record_duration);
    }
    for (r=0; r<self.num_records; r++) {
      var start = 0;
      for (var c=0; c<self.num_channels; c++) {
        var end = channel_bytes_map[c];
        self.channels[c].set_record(r, blob.slice(start, end));
        start = end;
      }
    }
  }

	var from_file = function (file, callback, header_only=false) {
		var reader = new FileReader();
    self.filename = file.name;
		reader.readAsArrayBuffer(file);
		reader.onload = function (evt) { onload_handler(evt, callback, header_only); };
	}

  self.from_file = from_file;
  return self;
};
