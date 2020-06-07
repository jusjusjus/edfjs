
'use strict';

const utils = require('./utils');
const Channel = require('./channel');

const toString = utils.toString;

class EDF {

  constructor() {
    this.fields = {
      version: [toString, 8],
      pid: [toString, 80],
      rid: [toString, 80],
      startdate: [toString, 8],
      starttime: [toString, 8],
      num_header_bytes: [Number, 8],
      reserved: [toString, 44],
      num_records: [Number, 8],
      record_duration: [Number, 8],
      num_channels: [Number, 4]
    };
    this.header_bytes = 256;
    this.bytes_per_sample = 2;
    this.channels = [];
  }

  get_physical_samples(t0=0, dt=null, channels=null, n=null) {
    if (t0 === null) {
      t0 = 0;
    }
    if (dt === null && n === null) {
      dt = this.duration;
    }
    if (channels === null) {
      channels = [];
      for (let label in this.channel_by_label) {
        channels.push(label);
      }
    }
    return new Promise((resolve) => {
      const data = {};
      for(let label of channels) {
        const channel = this.channel_by_label[label];
        data[label] = channel.get_physical_samples(t0, dt, n);
      }
      resolve(data);
    });
  }

  from_file(file, header_only=false) {
    return new Promise( (resolve) => {
      const reader = new FileReader();
      this.filename = file.name;
      reader.onload = (evt) => {
        this.read_buffer(evt.target.result, header_only);
        resolve(this);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  relative_date(milliseconds) {
    return new Date(this.relative_time(milliseconds));
  }

  read_buffer(buffer, header_only=false) {
    // header
    const hdr = utils.string_from_buffer(buffer, 0, this.header_bytes);
    this.read_header_from_string(hdr);
    if (this.num_channels == 0) {
      return null;
    }
    // channels
    const ch = utils.string_from_buffer(buffer, this.header_bytes, this.num_header_bytes);
    this.read_channel_header_from_string(ch);
    this.check_blob_size(buffer);
    // blob
    if(!header_only) {
      this.read_blob_from_buffer(buffer);
    }
  }

  read_header_from_string(string) {
    let start = 0;
    for (let name in this.fields) {
      const type = this.fields[name][0];
      const end = start + this.fields[name][1];
      this[name] = type(string.substring(start, end));
      start = end;
    }
    this.startdatetime = utils.parseDateTime(this.startdate, this.starttime);
  }

  read_channel_header_from_string(string) {
    if(this.num_channels === 0) {
      return;
    }
    for (let c=0; c < this.num_channels; c++) {
      this.channels.push(new Channel());
    }
    let start = 0;
    const channel_fields = this.channels[0].fields;
    for (let name in channel_fields) {
      const type = channel_fields[name][0];
      const len = channel_fields[name][1];
      for (let c=0; c < this.num_channels; c++) {
        const end = start + len;
        this.channels[c][name] = type(string.substring(start, end));
        start = end;
      }
    }
    this.channel_by_label = {};
    for(let channel of this.channels) {
      this.channel_by_label[channel.label] = channel;
    }
  }

  check_blob_size(buffer) {
    let samples_per_record = 0;
    for (let c=0; c < this.num_channels; c++) {
      samples_per_record += this.channels[c].num_samples_per_record;
    }
    const expected_samples = samples_per_record * this.num_records;
    const samples_in_blob = (buffer.byteLength - this.num_header_bytes) / 2;
    this.duration = this.record_duration * samples_in_blob / samples_per_record;
    utils.assert(samples_in_blob == expected_samples,
                 `Header implies ${expected_samples} samples; ${samples_in_blob} found.`);
    return samples_in_blob;
  }

  read_blob_from_buffer(buffer) {
    let record_channel_map = [0];
    for (let c=0; c < this.num_channels; c++) {
      record_channel_map.push(
        record_channel_map[c] + this.channels[c].num_samples_per_record);
    }
    const samples_per_record = record_channel_map[this.channels.length];
    let samples_in_blob = null;
    try {
      samples_in_blob = this.check_blob_size(buffer);
    } catch(err) {
      samples_in_blob = (buffer.byteLength - this.num_header_bytes) / this.bytes_per_sample;
    }
    const blob = new Int16Array(buffer, this.num_header_bytes, samples_in_blob);
    for (let c=0; c < this.num_channels; c++) {
      this.channels[c].init(this.num_records, this.record_duration);
    }
    for (let r=0; r < this.num_records; r++) {
      for (let c=0; c < this.num_channels; c++) {
        this.channels[c].set_record(r,
          blob.slice(
            r * samples_per_record + record_channel_map[c],
            r * samples_per_record + record_channel_map[c + 1]
          )
        );
      }
    }
    this.sampling_rate = {};
    for(let label in this.channel_by_label) {
      const channel = this.channel_by_label[label];
      this.sampling_rate[label] = channel.sampling_rate;
    }
  }

  relative_time(milliseconds) {
    return this.startdatetime.getTime() + milliseconds;
  }

}

module.exports = EDF;
