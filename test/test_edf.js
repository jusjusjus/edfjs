import fs from 'fs';
import chai from 'chai';
import almostChai from 'chai-almost';
const expect = chai.expect;
chai.use(almostChai(10e-6));

import EDF from '../src/edf.js';
import * as samples from '../examples/sample.json' assert { type: 'json' };

const fixtures = {
  'EDF': './cypress/fixtures/sample.edf',
};

describe('class EDF', () => {
  describe('.read_buffer()', () => {
    it('reads EDF-file header', () => {
      const filebuffer = fs.readFileSync(fixtures['EDF']).buffer;
      const edf = new EDF();
      edf.read_buffer(filebuffer, true);
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
        startdatetime: new Date('2002-02-04T22:07:23.000Z'),
        type: 'EDF',
      };
      Object.entries(expected).forEach(([key, value]) => {
        if (key === 'startdatetime') {
          expect(edf[key].toString()).to.equal(value.toString());
        } else {
          expect(edf[key]).to.equal(value);
        }
      });
    });
  });

  it('.read_physical_samples() returns correct samples', () => {
    const filebuffer = fs.readFileSync(fixtures['EDF']).buffer;
    const edf = new EDF();
    edf.read_buffer(filebuffer, false);
    for (let label in samples) {
      const expected = samples[label];
      edf.get_physical_samples(0.0, 1.0, [label])
        .then( (readSamples) => {
          readSamples = readSamples[label];
          expect(expected.length).to.equal(readSamples.length);
          for (let i=0; i < readSamples.length; i++) {
            expect(readSamples[i]).to.almost.equal(expected[i]);
          }
      });
    }
  });
});
