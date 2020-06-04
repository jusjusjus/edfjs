
'use strict';

const utils = require("./utils");
const Channel = require("./channel");

const toString = utils.toString;

function EDF(self) {
  self = self || {};
  self.fields = {
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
  const header_bytes = 256;
  const bytes_per_sample = 2;

  function read_header_from_string(string) {
    let start = 0;
    for (let name in self.fields) {
      const type = self.fields[name][0];
      const end = start + self.fields[name][1];
      self[name] = type(string.substring(start, end));
      start = end;
    }
    self.startdatetime = utils.parseDateTime(self.startdate, self.starttime);
  }

  function read_channel_header_from_string(string) {
    self.channels = [];
    for (let c=0; c < self.num_channels; c++) {
      self.channels.push(Channel());
    }
    let start = 0;
    const channel_fields = self.channels[0].fields;
    for (let name in channel_fields) {
      const type = channel_fields[name][0];
      const len = channel_fields[name][1];
      for (let c=0; c < self.num_channels; c++) {
        const end = start + len;
        self.channels[c][name] = type(string.substring(start, end));
        start = end;
      }
    }
    self.channel_by_label = {};
    for(let channel of self.channels) {
      self.channel_by_label[channel.label] = channel;
    }
  }

  function check_blob_size(buffer) {
    let samples_per_record = 0;
    for (let c=0; c < self.num_channels; c++) {
      samples_per_record += self.channels[c].num_samples_per_record;
    }
    const expected_samples = samples_per_record * self.num_records;
    const samples_in_blob = (buffer.byteLength - self.num_header_bytes)/2;
    self.duration = self.record_duration * samples_in_blob/samples_per_record;
    utils.assert(samples_in_blob == expected_samples,
                 `Header implies ${expected_samples} samples; ${samples_in_blob} found.`);
    return samples_in_blob;
  }

  function read_blob_from_buffer(buffer) {
    let record_channel_map = [0];
    for (let c=0; c < self.num_channels; c++) {
      record_channel_map.push(
        record_channel_map[c] + self.channels[c].num_samples_per_record);
    }
    const samples_per_record = record_channel_map[self.channels.length];
    let samples_in_blob = null;
    try {
      samples_in_blob = check_blob_size(buffer);
    } catch(err) {
      samples_in_blob = (buffer.byteLength - self.num_header_bytes) / bytes_per_sample;
    }
    const blob = new Int16Array(buffer, self.num_header_bytes, samples_in_blob);
    for (let c=0; c < self.num_channels; c++) {
      self.channels[c].init(self.num_records, self.record_duration);
    }
    for (let r=0; r < self.num_records; r++) {
      for (let c=0; c < self.num_channels; c++) {
        self.channels[c].set_record(r,
          blob.slice(
            r * samples_per_record + record_channel_map[c],
            r * samples_per_record + record_channel_map[c + 1]
          )
        );
      }
    }
    self.sampling_rate = {};
    for(let label in self.channel_by_label) {
      const channel = self.channel_by_label[label];
      self.sampling_rate[label] = channel.sampling_rate;
    }
  }

  function read_buffer(buffer, header_only=false) {
    // header
    const hdr = utils.string_from_buffer(buffer, 0, header_bytes);
    read_header_from_string(hdr);
    if (self.num_channels == 0) {
      return null;
    }
    // channels
    const ch = utils.string_from_buffer(buffer, header_bytes, self.num_header_bytes);
    read_channel_header_from_string(ch);
    check_blob_size(buffer);
    // blob
    if(!header_only) {
      read_blob_from_buffer(buffer);
    }
  }

  function from_file(file, header_only) {
    header_only = header_only || false;
    return new Promise( (resolve) => {
      const reader = new FileReader();
      self.filename = file.name;
      reader.onload = (evt) => {
        read_buffer(evt.target.result, header_only);
        resolve(self);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  function get_physical_samples(t0, dt, channels, n) {
    return new Promise((resolve) => {
      const data = {};
      for(let label of channels) {
        data[label] = self.channel_by_label[label].get_physical_samples(t0, dt, n);
      }
      resolve(data);
    });
  }

  function relative_time(milliseconds) {
    return self.startdatetime.getTime() + milliseconds;
  }

  function relative_date(milliseconds) {
    return new Date(relative_time(milliseconds));
  }

  self.from_file = from_file;
  self.read_buffer = read_buffer;
  self.relative_date = relative_date;
  self.get_physical_samples = get_physical_samples;
  self.read_header_from_string = read_header_from_string;
  return self;
}

module.exports = EDF;
