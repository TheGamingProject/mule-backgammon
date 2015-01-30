var randomUtils = require('mule-utils/randomUtils');

exports.getDiceRoll = function () {
  return {
    die1: randomUtils.getRandomInt(1,6),
    die2: randomUtils.getRandomInt(1,6)
  };
};