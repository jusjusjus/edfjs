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
      {date: '2015-10-15', time: '10:05:15',
       expected: new Date(Date.UTC(2015, 9, 15, 10, 5, 15, 0))},
      {date: '15.10.2015', time: '10:05:15',
       expected: new Date(Date.UTC(2015, 9, 15, 10, 5, 15, 0))},
      {date: '10/15/2015', time: '10:05:15',
       expected: new Date(Date.UTC(2015, 9, 15, 10, 5, 15, 0))},
      {date: '10/15/2015', time: '10:05:15.135',
       expected: new Date(Date.UTC(2015, 9, 15, 10, 5, 15, 135))},
      {date: '10/15/2015', time: '10:05:15.005',
       expected: new Date(Date.UTC(2015, 9, 15, 10, 5, 15, 5))},
    ];
    for(let {date, time, expected} of cases) {
      it(`parses ${date} ${time}`, () => {
        const dt = utils.parseDateTime(date, time);
        expect(dt).to.equalDate(expected);
        expect(dt).to.equalTime(expected);
      });
    }
  });
});
