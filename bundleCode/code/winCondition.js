module.exports = function (M) {
  var checkIfPlayerWon = function (playerRel) {
    var playersScoreSpaceId = playerRel === 'p1' ? 'blackScoreSpace' : 'redScoreSpace',
      playersScoreSpacePieces = M.getPieces({
        spaceId: playersScoreSpaceId,
        ownerId: playerRel
      });

    return playersScoreSpacePieces.length === 15;
  };

  if (checkIfPlayerWon('p1')) {
    return 'p1';
  }

  if (checkIfPlayerWon('p2')) {
    return 'p2';
  }
};
