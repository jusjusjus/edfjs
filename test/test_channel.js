
'use strict';

const fs = require('fs');

const chai = require('chai');
const expect = chai.expect;
const almostChai = require('chai-almost');
chai.use(almostChai(10e-6));

const EDF = require('../src/edf');
const samples = require('../examples/sample.json');

const edfFilename = './examples/sample.edf';

describe('Channel', () => {
  const filebuffer = fs.readFileSync(edfFilename).buffer;
  const edf = EDF();
  edf.read_buffer(filebuffer, false);
  const channel = edf.channels[0];
  describe('#get_physical_samples', () => {
    const samplingRate = channel.sampling_rate;
    const samples_dt = channel.get_physical_samples(0.0, 1.0);
    const samples_n = channel.get_physical_samples(0.0, null, samplingRate);
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
