var _ = require('lodash');

exports.getSimpleSpaceLinearDistance = function (boardDef, startSpaceId, destinationSpaceId, tokenColor) {
  if (startSpaceId === destinationSpaceId) return 0;

  var hopped = 0;

  //  "edges":[{"id":"23","moveableBy":"black"},{"id":"redScoreSpace","moveableBy":"red"}
  // there should only be one accessible edge
  var aRecursiveFunction = function (spaceId) {
    //console.log('looking at ' + spaceId + ', ' + hopped + ' away');
    var currentSpace = searchThruBoardDefForId(boardDef, spaceId);

    if (currentSpace.id === destinationSpaceId) {
      // we're here!
      return;
    }

    var found = false;
    _.each(currentSpace.edges, function (edge) {
      if (edge.moveableBy === tokenColor) {
        hopped++;
        aRecursiveFunction(edge.id);
        found = true;
      }
    });
    if (!found) {
      hopped = -1;
    }
  };
  aRecursiveFunction(startSpaceId);

  if (hopped === 0) return -1;
  return hopped;
};

// confusing gameboard.board gamestate board, need good action utils, so you dont need any of this grossness in RB code
var searchThruBoardDefForId = function (spaces, spaceId) {
  var found = false;
  _.each(spaces, function (value, key) {
    if (value.id === spaceId) {
      found = value;
    }
  });
  return found;
};
