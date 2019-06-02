var _ = require('lodash');

var actionsUtils = require('mule-utils/actionsUtils'),
  roller = require('./roller');

module.exports = function (M) {

  // put prev dice roll in meta

  // then roll for the next turn
  M.setGlobalVariable('roll', roller.getDiceRoll());

  return M.persistQ()
    .then(function () {
      //return meta data
      return {};
    });
};
