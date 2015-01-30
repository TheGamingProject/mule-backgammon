var Q = require('q'),
  _ = require('lodash');

var actionsUtils = require('mule-utils/actionsUtils'),
  bgUtils = require('./bgUtils');

// should this be named validateTurn???
module.exports = function (M, playerRel, actions) {
  var opponentRel = playerRel === 'p1' ? 'p2' : 'p1',
    actionParams;

  M.log('validating actions!!  ' + actions.length);

  //////// CHECK validateActions PARAMS ////////
  if (actions.length != 1) {
    throw 'you must only have one action per backgammon turn';
  }

  actionParams = actions[0].params;
  if (!actionParams.moveTokens) {
    throw 'no moveTokens subactions?';
  }

  //////////////////////////////////////////////
  var theRoll = M.getGlobalVariable('roll'),
    isDoubles = theRoll.die1 === theRoll.die2,
    rollArray = (isDoubles) ? [theRoll.die1, theRoll.die1, theRoll.die2, theRoll.die2] : [theRoll.die1, theRoll.die2],
    totalMoves = 0,
    requiredMoves = isDoubles ? 4 : 2;

  //////// CHECK IF MOVES OUT OF JAIL ARE MADE ////////
  // we need to check if the player moved all their jailed tokens before any other moves
  var jailId = playerRel === 'p1' ? 'blackJail' : 'redJail',
    jailedTokens = M.getPieces({spaceId: jailId, ownerId: playerRel}),
    jailedMovesRequired = jailedTokens.length,
    totalJailMoves = {};

  _.each(actionParams.moveTokens, function (moveSubAction) {
    totalMoves += moveSubAction.spaceId.length;
    if (moveSubAction.currentPieceSpace === jailId) {
      var rollUsed = bgUtils.spaceIdToUnjailRoll(moveSubAction.spaceId[0]);
      totalJailMoves[moveSubAction.pieceId] = rollUsed;
    }
  });

  if (jailedMovesRequired === 0) {
    M.log('no jailed friendly tokens')
  } else {
    M.log(playerRel + ' has ' + jailedMovesRequired + ' jailed tokens')

    var isCantMove = false,
      canReleaseAmount = 0;

    // figure out if play can move all there jailed tokens
    var gammonAreaPieces = getGammonAreaPieceArray(M, opponentRel, opponentRel);

    _.each(rollArray, function (roll) {
      M.log('canRelease: ' + roll);
      M.log(gammonAreaPieces[roll - 1]);
      var piecesOnGammonSpot = gammonAreaPieces[roll - 1];
      M.log(roll + ': ' + piecesOnGammonSpot.length);
      if (piecesOnGammonSpot.length <= 1) {
        canReleaseAmount++; // not iterating thru dice correct? (not checking if every dice roll is used)
      }
    });

    // cantMove: rolls are on spaces that are occupied in the gammon area
    isCantMove = canReleaseAmount < jailedMovesRequired;
    var reallyCantMove = false;

    M.log(_.keys(totalJailMoves).length + '  ' + jailedMovesRequired + '  ' + isCantMove);
    // meets jailedMovesRequired
    if (_.keys(totalJailMoves).length === jailedMovesRequired) {
      // good
    } else if (isCantMove && _.keys(totalJailMoves).length === canReleaseAmount) {
      // rolls cant free jailed tokens (so cant move anything, or move what you could)
      reallyCantMove = true;
    } else {
      throw 'you must unjail your kiddos: ' + _.keys(totalJailMoves).length + '/' + jailedMovesRequired
        + ', cantMove: ' + isCantMove + ', canReleaseAmount: ' + canReleaseAmount;
    }

  }

  //// CHECK IF MOVES INTO SCORESPACE ARE VALID ////
  var playersScoreSpaceId = (playerRel === 'p1' ? 'blackScoreSpace' : 'redScoreSpace'),
    scoredPiecesCount = M.getPieces({spaceId: playersScoreSpaceId, ownerId: playerRel}).length, 
    movesIntoScoreSpaceCount = 0,
    movesIntoGammonAreaCount = 0,
    movesIntoScoreSpaceFromOutsideOfGammonAreaCount = 0;
  // 1. check for how many moves were attempted into their scoreSpace
  _.each(actionParams.moveTokens, function (subMoveAction) {
    var finalMoveSpaceId = subMoveAction.spaceId[subMoveAction.spaceId.length - 1];

    // count scoreSpace moves
    if (finalMoveSpaceId === playersScoreSpaceId) {
      movesIntoScoreSpaceCount++;

      // check if it was not in gammon area before
      var pieceMoved = M.getPiece(subMoveAction.pieceId),
        inGammonArea = false;

      _.each(gammonSpaceIds[playerRel], function (gammonSpaceId) {
        if (pieceMoved.locationId === gammonSpaceId) {
          inGammonArea = true;
        }
      });
      if (!inGammonArea) {
        movesIntoScoreSpaceFromOutsideOfGammonAreaCount++;
      }

      return;
    }

    // count into gammon area moves
    _.each(gammonSpaceIds[playerRel], function (gammonSpaceId) {
      if (finalMoveSpaceId === gammonSpaceId) {
        movesIntoGammonAreaCount++;
      }
    });
  });

  // 2. if any moves were attempted, check how many pieces are in the gammon area (spaces 1-6 for black-p1, spaces 19-24 for red-p2) 
  if (movesIntoScoreSpaceCount > 0) {
    var gammonPieceCount = getPiecesCountInGammonArea(M, playerRel, playerRel);

  // 3. if the amount of moves into gammon area + gammon area pieces + scoredPiecesCount + movesIntoScoreSpaceFromOutsideOfGammonAreaCount does not equal 15, throw error
    if (movesIntoScoreSpaceFromOutsideOfGammonAreaCount + scoredPiecesCount + gammonPieceCount + movesIntoGammonAreaCount < 15) {
      throw 'you must have all of your tokens in the gammon area before you can score. ' +
        'scoredPiecesCount: ' + scoredPiecesCount + ' gammonPieceCount: ' + gammonPieceCount +
        ', movesIntoGammonAreaCount: ' + movesIntoGammonAreaCount +
        ', movesIntoScoreSpaceFromOutsideOfGammonAreaCount: ' + movesIntoScoreSpaceFromOutsideOfGammonAreaCount;
    }
  }

  //////////////////////////////////////////////////

  M.log('submitted moves: ' + totalMoves + '/' + requiredMoves);

  if (totalMoves !== requiredMoves && !reallyCantMove) {
    throw 'you haven\'t used all of your dice (' + totalMoves + '/' + requiredMoves + ')';
  }

  // TODO check all rolls were used exactly once (if moves are available)

  return Q(actions);
};

var gammonSpaceIds = {
  p1: ['1', '2', '3', '4', '5', '6'],
  p2: ['24', '23', '22', '21', '20', '19']
};

var getGammonAreaPieceArray = function (M, playerRelSide, playerRel) {
  var gammonArea;
  // EFF this function :(
  if (playerRelSide === 'p1') {
    gammonArea = [
      M.getPieces({spaceId: '1', ownerId: playerRel}),
      M.getPieces({spaceId: '2', ownerId: playerRel}),
      M.getPieces({spaceId: '3', ownerId: playerRel}),
      M.getPieces({spaceId: '4', ownerId: playerRel}),
      M.getPieces({spaceId: '5', ownerId: playerRel}),
      M.getPieces({spaceId: '6', ownerId: playerRel})
    ];
  } else {
    gammonArea = [
      M.getPieces({spaceId: '24', ownerId: playerRel}),
      M.getPieces({spaceId: '23', ownerId: playerRel}),
      M.getPieces({spaceId: '22', ownerId: playerRel}),
      M.getPieces({spaceId: '21', ownerId: playerRel}),
      M.getPieces({spaceId: '20', ownerId: playerRel}),
      M.getPieces({spaceId: '19', ownerId: playerRel})
    ];
  }

  return gammonArea;
};

var getPiecesCountInGammonArea = function (M, playerRelSide, playerRel) {
  var gammonAreaPieces = getGammonAreaPieceArray(M, playerRelSide, playerRel),
    count = 0;

    _.each(gammonAreaPieces, function (gammonSpacePieces) {
      count += gammonSpacePieces.length;
    });

    return count;
};
