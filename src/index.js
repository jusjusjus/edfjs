
'use strict';

var EDF = require("./edf");
var utils = require("./utils");
var Channel = require("./channel");

module.exports = {
  EDF: EDF,
  Channel: Channel,
  string_from_buffer: utils.string_from_buffer
};
