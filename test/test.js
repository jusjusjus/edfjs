
'use strict';

const fs = require('fs');

const chai = require('chai');
const expect = chai.expect;
const almostChai = require('chai-almost');
chai.use(almostChai(10e-6));

const edfjs = require('../src/index');
const samples = require('../examples/sample.json');

const edfFilename = "./examples/sample.edf";

describe('Channel', () => {
  const filebuffer = fs.readFileSync(edfFilename).buffer;
  const edf = edfjs.EDF();
  edf.read_buffer(filebuffer, false);
  const channel = edf.channels[0];
  describe('#get_physical_samples', () => {
    const samplingRate = channel.sampling_rate;
    const samples_dt = channel.get_physical_samples(0.0, 1.0);
    const samples_n = channel.get_physical_samples(0.0, null, samplingRate);
    // const samples = ;
    it(`returns samples at ${samplingRate} Hz`, () => {
      expect(samples_dt.length).to.equal(samples_n.length);
      expect(samples_dt.length).to.equal(samplingRate);
    });
    it('returns same samples with seconds and number', () => {
      for (let i=0; i < samples_dt.length; i++) {
        expect(samples_dt[i]).to.equal(samples_n[i]);
      }
    });
    it('returns about same samples as edfdb', () => {
      const samples_real = samples[channel.label];
      for (let i=0; i < samples_dt.length; i++) {
        expect(samples_dt[i]).to.almost.equal(samples_real[i]);
      }
    });
  });
});

describe('EDF Header', () => {
  const filebuffer = fs.readFileSync(edfFilename).buffer;
  const edf = edfjs.EDF();
  edf.read_buffer(filebuffer, true);
  describe('#read_header', () => {
    it('reads correct header info', () => {
      const expected = {
        version: '0',
        pid: 'brux2',
        rid: '',
        startdate: '04.02.02',
        starttime: '22.07.23',
        num_header_bytes: 1536,
        reserved: '',
        num_records: 100,
        record_duration: 1,
        num_channels: 5,
        startdatetime: new Date("2002-02-04T22:07:23.000Z")
      };
      for (let key in expected) {
        if (key === 'startdatetime') {
          expect(edf[key].toString()).to.equal(expected[key].toString());
        } else {
          expect(edf[key]).to.equal(expected[key]);
        }
      }
    });
  });
});

describe('EDF', () => {
  const filebuffer = fs.readFileSync(edfFilename).buffer;
  const edf = edfjs.EDF();
  edf.read_buffer(filebuffer, false);
  describe('#get_physical_samples', () => {
    it('returns about same samples as edfdb', () => {
      for (let label in samples) {
        const expected = samples[label];
        edf.get_physical_samples(0.0, 1.0, [label])
          .then( (readSamples) => {
            readSamples = readSamples[label];
            expect(expected.length).to.equal(readSamples.length);
            for (let i=0; i < readSamples.length; i++) {
              expect(readSamples[i]).to.almost.equal(expected[i]);
            }
        })
      }
    });
  });
});
