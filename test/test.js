
'use strict';
var expect = require('chai').expect;
var fs = require('fs');
var edfjs = require('../src/index');

// download 'sample.edf' to test the edf reader
var download = function (url, filename=null) {
  var https = require('https');
  if (filename == null) {
    filename = url;
  }
  var file = fs.createWriteStream(filename);
  var request = https.get(url, function(response) {
    response.pipe(file);
  });
}
var url = "https://cdn.rawgit.com/jusjusjus/pyedf/82d67855/example/sample.edf";
var dir = './tmp';
var filename = dir+"/sample.edf";
if (!fs.existsSync(filename)) {
  try {
    fs.mkdirSync(dir);
  } catch (err) {
    if (err.code !== 'EEXIST') { throw err; }
  }
  console.log("Downloading "+url+". This may take a minute..");
  download(url, filename);
}
var buffer = fs.readFileSync(filename);


describe('#edf.read_header_from_string', function () {
  var edf = edfjs.EDF();
  edf.read_header_from_string(buffer.toString('utf8', 0, 256));

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
