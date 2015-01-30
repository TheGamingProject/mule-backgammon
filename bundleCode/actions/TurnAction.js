var _ = require('lodash'),
  Q = require('q');

var actionsUtils = require('mule-utils/actionsUtils'),
  randomUtils = require('mule-utils/randomUtils'),
  linearUtils = require('../code/linearUtils'),
  bgUtils = require('../code/bgUtils');

/**
 * params should contain:
 *  - moveTokens: an array of moveSubactions
 * moveSubactions:
 *  - {pieceId: 4, rollUsed: [2], spaceId: [4]}
 */

exports.validateQ = function (M, actionOwnerRel, params) {
  var thisTurnRoll = M.getGlobalVariable('roll');

  _.each(params.moveTokens, function (moveSubAction) {
    M.log('try to move p[' + moveSubAction.pieceId + '] to s[' + JSON.stringify(moveSubAction.spaceId) + ']');

    var pieceToMove = M.getPiece(moveSubAction.pieceId);
    if (!pieceToMove) {
      throw 'invalid pieceId: ' + pieceId;
    }

    var checkMoveValidity = function (sourceId, rollUsed, destId) {
      M.log(sourceId + ' -> ' + destId + ' (r' + rollUsed + ')');
      var possibleRoll = getRollUsed(M.getBoardDefinition(), sourceId, destId, pieceToMove.attributes.color);
      M.log('space distance: ' + possibleRoll);
      M.log('rollUsed: ' + rollUsed);

      // if possibleRoll is an array, you are moving to a scorespace
      if (_.isArray(possibleRoll)) {
        if (rollUsed !== thisTurnRoll.die1 && rollUsed !== thisTurnRoll.die2) {
          throw 'rollUsed is not was not rolled.';
        }

        if (!_.contains(possibleRoll, rollUsed)) {
          throw '(moving to scorespace) invalid rollUsed ' + possibleRoll + ', rollUsed:' + rollUsed;
        }

        M.log('valid scorespace move')
        return;
      }

      if (possibleRoll === thisTurnRoll.die1 || possibleRoll === thisTurnRoll.die2) {
        //valid
        M.log('valid distance')

        // check for enemys
        var enemyRelId = actionOwnerRel === 'p1' ? 'p2' : 'p1',
          enemys = M.getPieces({spaceId: destId, ownerId: enemyRelId});
        M.log('enemys on space I move to: ' + enemys.length);

        if (enemys.length === 1) {
          // knock him to jail
        } else if (enemys.length > 1) {
          throw 'you cannot move to spaceId[' + destId + '] it is occupied by ' + enemys.length + ' opponent tokens';
        }

      } else {
        M.log('invalid distance')
        throw 'invalid move ' + sourceId + ' to ' + destId + ' = ' + possibleRoll
          + ' (' + thisTurnRoll.die1 + ',' + thisTurnRoll.die2 + ')';
      }
    };

    moveSubAction.currentPieceSpace = pieceToMove.locationId;

    checkMoveValidity(pieceToMove.locationId, moveSubAction.rollUsed[0], moveSubAction.spaceId[0]);
    var i = 0;
    _(moveSubAction.spaceId.length - 1).times(function (n) {
      checkMoveValidity(moveSubAction.spaceId[0 + n], moveSubAction.rollUsed[1 + n], moveSubAction.spaceId[1 + n]);
    });

  });
};

var sendToJail = function (M, piece) {
  // playerRel is piece.ownerId
  piece.locationId = piece.ownerId === 'p1' ? 'blackJail' : 'redJail';
  M.setPiece(piece.id, piece);
};

exports.doQ = function (M, actionOwnerRel, params) {
  var myRoll = M.getGlobalVariable('roll');
  M.log('this turns roll was ' + myRoll);

  var _metadata = {
    roll: myRoll,
    knockedPieces: []
  };

  _.each(params.moveTokens, function (moveSubAction) {
    var destSpaceId = moveSubAction.spaceId,
      piece = M.getPiece(moveSubAction.pieceId),
      enemyRelId = actionOwnerRel === 'p1' ? 'p2' : 'p1';

    // check for possible knocks to jail
    _.each(destSpaceId, function (destId) {
      var opponentTokens = M.getPieces({spaceId: destId, ownerId: enemyRelId});
      M.log('opponentTokens on space piece is moving to: '); M.log(opponentTokens)
      if (opponentTokens.length === 1) {
        _metadata.knockedPieces.push({
          pieceId: opponentTokens[0].id,
          fromSpaceId: opponentTokens[0].locationId
        });
        sendToJail(M, opponentTokens[0]);
      }
    });

    // change location to the final destSpaceId
    piece.locationId = destSpaceId[destSpaceId.length - 1];
    M.setPiece(piece.id, piece);
    M.log('moved p[' + moveSubAction.pieceId + '] to s[' + destSpaceId + ']');
  });

  return M.persistQ()
    .then(function () {
      //add meta data
      return Q(_metadata);
    });
};

//can return an array of possible rolls (when moving to score spaces)
var getRollUsed = function (board, sourceId, destId, color) {
  if (sourceId === 'blackJail' || sourceId === 'redJail') {
    return bgUtils.spaceIdToUnjailRoll(destId);
  }
  if (destId === 'blackScoreSpace' || destId === 'redScoreSpace') {
    var distance =  linearUtils.getSimpleSpaceLinearDistance(board, sourceId, destId, color);
    M.log('getRollUsed debug:')
    M.log(sourceId + ' to ' + destId);
    M.log(distance);

    var array = [];
    _(7 - distance).times(function (i) {
      M.log(distance + i);
      array.push(distance + i);
    });

    return array.length > 0 ? array : distance;
  }
  return linearUtils.getSimpleSpaceLinearDistance(board, sourceId, destId, color);
};
