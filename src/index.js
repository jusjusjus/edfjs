
'use strict';

var EDF = require("./edf");
var utils = require("./utils");
var Channel = require("./channel");

var edfjs = {
  EDF: EDF,
  Channel: Channel,
  string_from_buffer: utils.string_from_buffer
};

module.exports = edfjs;
global.edfjs = edfjs;
