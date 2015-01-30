
module.exports = {
  gameStart: require('./code/gameStart'),

  actions: {
    'TurnAction': require('./actions/TurnAction')
  },
  validateTurn: require('./code/validateTurn'),

  progressTurn: require('./code/progressTurn'),
  progressRound: undefined, // not needed in backgammon
  winCondition: require('./code/winCondition')
};