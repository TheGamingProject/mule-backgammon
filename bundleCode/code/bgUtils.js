exports.spaceIdToUnjailRoll = function (spaceId) {
  var spaceIdInt = parseInt(spaceId);

  if (spaceIdInt >= 1 && spaceIdInt <= 6) {
    return spaceIdInt;
  } else if (spaceIdInt >= 19 && spaceIdInt <= 24) {
    return 25 - spaceIdInt;
  } else {
    return -1;
  }
};