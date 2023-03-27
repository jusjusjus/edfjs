import chai from 'chai';
const expect = chai.expect;
import chaiDatetime from 'chai-datetime';
chai.use(chaiDatetime);

import * as utils from '../src/utils.js';

describe('utils', () => {

  describe('#toString', () => {
    it('trims strings correctly', () => {
      expect(utils.toString(' Hello ')).to.equal('Hello');
    });
  });

  describe('#assert', () => {
    it('throws on false', () => {
      expect(() => utils.assert(false)).to.throw();
    });
    it('passes on true', () => {
      expect(() => utils.assert(true)).to.not.throw();
    });
  });

  describe('#parseDateTime', () => {
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
