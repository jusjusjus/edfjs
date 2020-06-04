
'use strict';

const EDF = require('./edf');
const utils = require('./utils');
const Channel = require('./channel');

const edfjs = {
  EDF: EDF,
  Channel: Channel,
  string_from_buffer: utils.string_from_buffer
};

module.exports = edfjs;
global.edfjs = edfjs;
