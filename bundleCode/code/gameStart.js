
var roller = require('./roller');

var gameStartHook = function (M) {
  M.setGlobalVariable('roll', roller.getDiceRoll());

  return M.persistQ();
};

module.exports = gameStartHook;