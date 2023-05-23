import chai from 'chai';
const expect = chai.expect;
import chaiDatetime from 'chai-datetime';
chai.use(chaiDatetime);

import * as utils from '../src/utils.js';

describe('utils', () => {

  describe('.parseAnnotations()', () => {
    it('parses TAL w/out duration', () => {
      const annotations = '+0.1\x14TAL w/out duration\x14\x00';
      const buffer = new Buffer.from(annotations, 'utf8');
      const array = new Uint8Array(buffer);
      const actual = utils.parseAnnotations(array);
      expect(actual).to.deep.equal([
        { onset: 0.1, duration: 0, label: ['TAL w/out duration'] },
      ]);
    });

    it('parses TAL w/out duration and two labels', () => {
      const annotations = '+0.1\x14first label\x14second label\x14\x00';
      const buffer = new Buffer.from(annotations, 'utf8');
      const array = new Uint8Array(buffer);
      const actual = utils.parseAnnotations(array);
      expect(actual).to.deep.equal([
        { onset: 0.1, duration: 0, label: ['first label', 'second label'] },
      ]);
    });

    it('parses two TALs w/out duration', () => {
      const annotations = '+10.0\x14first TAL\x14\x00+20.0\x14second TAL\x14\x00';
      const buffer = new Buffer.from(annotations, 'utf8');
      const array = new Uint8Array(buffer);
      const actual = utils.parseAnnotations(array);
      expect(actual).to.deep.equal([
        { onset: 10, duration: 0, label: ['first TAL'] },
        { onset: 20, duration: 0, label: ['second TAL'] },
      ]);
    });

    it('parses two TALs with space', () => {
      const annotations = '+10.0\x14first TAL\x14\x00\x00\x00+20.0\x14second TAL\x14\x00';
      const buffer = new Buffer.from(annotations, 'utf8');
      const array = new Uint8Array(buffer);
      const actual = utils.parseAnnotations(array);
      expect(actual).to.deep.equal([
        { onset: 10, duration: 0, label: ['first TAL'] },
        { onset: 20, duration: 0, label: ['second TAL'] },
      ]);
    });

    it('parses TAL with duration', () => {
      const annotations = '+0.1\x151.5\x14TAL with duration\x14\x00';
      const buffer = new Buffer.from(annotations, 'utf8');
      const array = new Uint8Array(buffer);
      const actual = utils.parseAnnotations(array);
      expect(actual).to.deep.equal([
        { onset: 0.1, duration: 1.5, label: ['TAL with duration'] },
      ]);
    });

    it('parses TAL with multiple annotations', () => {
      const annotations = '+0.1\x151.5\x14first label\x14second label\x14\x00';
      const buffer = new Buffer.from(annotations, 'utf8');
      const array = new Uint8Array(buffer);
      const actual = utils.parseAnnotations(array);
      expect(actual).to.deep.equal([
        { onset: 0.1, duration: 1.5, label: ['first label', 'second label'] },
      ]);
    });
  });

  it('.toString() trims strings correctly', () => {
    expect(utils.toString(' Hello ')).to.equal('Hello');
  });

  describe('.assert()', () => {
    it('throws on false', () => {
      expect(() => utils.assert(false)).to.throw();
    });
    it('passes on true', () => {
      expect(() => utils.assert(true)).to.not.throw();
    });
  });

  describe('.parseDateTime()', () => {
    const cases = [
      {date: '18.02.84', time: '14:24:11',
       expected: new Date(Date.UTC(2084, 1, 18, 14, 24, 11, 0))},
      {date: '26.04.86', time: '01:23:00',
       expected: new Date(Date.UTC(1986, 3, 26, 1, 23, 0, 0))},
      {date: '15-10-15', time: '10:05:15',
       expected: new Date(Date.UTC(2015, 9, 15, 10, 5, 15, 0))},
      {date: '15.10.15', time: '10:05:15',
       expected: new Date(Date.UTC(2015, 9, 15, 10, 5, 15, 0))},
      {date: '10/15/15', time: '10:05:15',
       expected: new Date(Date.UTC(2015, 9, 15, 10, 5, 15, 0))},
      {date: '10/15/15', time: '10:05:15.135',
       expected: new Date(Date.UTC(2015, 9, 15, 10, 5, 15, 135))},
      {date: '10/15/15', time: '10:05:15.005',
       expected: new Date(Date.UTC(2015, 9, 15, 10, 5, 15, 5))},
    ];
    for(let {date, time, expected} of cases) {
      it(`parses ${date} ${time} as ${expected}`, () => {
        const dt = utils.parseDateTime(date, time);
        expect(dt).to.equalDate(expected);
        expect(dt).to.equalTime(expected);
      });
    }
  });
});
