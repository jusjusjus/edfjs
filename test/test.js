
'use strict';
var expect = require('chai').expect;
var fs = require('fs');
var edfjs = require('../src/index');

var filename = "./tmp/sample.edf";
var file = fs.readFileSync(filename);
var edf = edfjs.EDF();
edf.read_buffer(file.buffer, false);

describe('#Channel.get_physical_samples', function () {
  var using_dt = edf.channels[0].get_physical_samples(0.0, 1.0);
  var using_n = edf.channels[0].get_physical_samples(0.0, null, 256);
  expect(using_dt.length).to.equal(using_n.length);
  for (var i=0; i < using_dt.length; i++) {
    expect(using_dt[i]).to.equal(using_n[i]);
  }
});

describe('#EDF.get_physical_samples-using-variable-n', function () {
  var channel = edf.channels[0];
  var channel_data = channel.get_physical_samples(0.0, 1.0);
  edf.get_physical_samples(0.0, null, [channel.label], 256).then( (data) => {
    var edf_data = data[channel.label];
    expect(channel_data.length).to.equal(edf_data.length);
    for (var i=0; i < channel_data.length; i++) {
      expect(channel_data[i]).to.equal(edf_data[i]);
    }
  });
});

describe('#EDF.read_header', function () {
  var expected = {
    version: '0',
    pid: 'brux2',
    rid: '',
    startdate: '04.02.02',
    starttime: '22.07.23',
    num_header_bytes: 1536,
    reserved: '',
    num_records: 31194,
    record_duration: 1,
    num_channels: 5,
    startdatetime: new Date("2002-02-04T22:07:23.000Z")
  };
  for (var key in expected) {
    if(key==='startdatetime') {
      expect(edf[key].toString()).to.equal(expected[key].toString());
    } else {
      expect(edf[key]).to.equal(expected[key]);
    }
  }
});
