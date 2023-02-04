'use strict';

const utils = require('./utils');
const toString = utils.toString;

class Channel {

  constructor() {
    this.fields = {
      label: [toString, 16],
      channel_type: [toString, 80],
      physical_dimension: [toString, 8],
      physical_minimum:	[Number, 8],
      physical_maximum: [Number, 8],
      digital_minimum: [Number, 8],
      digital_maximum: [Number, 8],
      prefiltering: [toString, 80],
      num_samples_per_record: [Number, 8],
      reserved: [toString, 32]
    };
  }

  init(num_records, record_duration) {
    if (this.num_samples_per_record == null) {
      throw 'init called on uninitialized channel';
    }
    this.blob = new Float32Array(num_records * this.num_samples_per_record);
    this.scale = (this.physical_maximum - this.physical_minimum) /
                 (this.digital_maximum  - this.digital_minimum);
    this.offset = this.physical_maximum / this.scale - this.digital_maximum;
    this.sampling_rate = this.num_samples_per_record / record_duration;
  }

  digital2physical(d) {
    return this.scale * (d + this.offset);
  }

  set_record(record, digi) {
    const start = record * this.num_samples_per_record;
    for (let i = 0; i < this.num_samples_per_record; i++) {
      this.blob[start + i] = this.digital2physical(digi[i]);
    }
  }

  get_physical_samples(t0, dt, n) {
    n = n || dt * this.sampling_rate;
    const start = t0 * this.sampling_rate;
    return this.blob.slice(start, start+n);
  }
}

module.exports = Channel;
