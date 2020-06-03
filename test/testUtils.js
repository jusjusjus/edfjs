
'use strict';

const chai = require('chai');
chai.use(require('chai-datetime'));
const expect = chai.expect;

const utils = require('../src/utils');

describe('utils', () => {

  describe('#toString', () => {
    it('trims strings correctly', () => {
      expect(utils.toString(" Hello ")).to.equal("Hello");
    });
  });

  describe("#assert", () => {
    it('throws on false', () => {
      expect(() => utils.assert(false)).to.throw();
    });
    it('passes on true', () => {
      expect(() => utils.assert(true)).to.not.throw();
    });
  });

  describe('#parseDateTime', () => {
    it('parses 2015-10-15 10:05:15', () => {
      const date = utils.parseDateTime('2015-10-15', '10:05:15');
      const expected = new Date(Date.UTC(2015, 9, 15, 10, 5, 15, 0));
      expect(date).to.equalDate(expected);
      expect(date).to.equalTime(expected);
    });

    it('parses 15.10.2015 10:05:15', () => {
      const date = utils.parseDateTime('15.10.2015', '10:05:15');
      const expected = new Date(Date.UTC(2015, 9, 15, 10, 5, 15, 0));
      expect(date).to.equalDate(expected);
      expect(date).to.equalTime(expected);
    });

    it('parses 10/15/2015 10:05:15', () => {
      const date = utils.parseDateTime('10/15/2015', '10:05:15');
      const expected = new Date(Date.UTC(2015, 9, 15, 10, 5, 15, 0));
      expect(date).to.equalDate(expected);
      expect(date).to.equalTime(expected);
    });

    it('parses 10/15/2015 10:05:15.135', () => {
      const date = utils.parseDateTime('10/15/2015', '10:05:15.135');
      const expected = new Date(Date.UTC(2015, 9, 15, 10, 5, 15, 135));
      expect(date).to.equalDate(expected);
      expect(date).to.equalTime(expected);
    });
  });
});
