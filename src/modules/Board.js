
define(['RenderHelper'], function (RenderHelper) {
  var images = {
      board: {},
      die: {},
      pieces: {},
      shaker: null,

      ui: {},
      buttons: {}
    };

  var indicatorImages = {
    selection: 'assets/indicator-selection.png',
    move: 'assets/indicator-move.png',
    knock: 'assets/indicator-knock.png'
  };

  var size = {x: 1280, y: 960},

    tokenOffset = {x: .05, y: .01}, // offset from the pieceStartLocations[]
    tokenClickAreaPosOffset = {x: -.05, topY: -.015, botY: -.25},
    tokenClickAreaSize = {x: .053, y: .32},

    jailClickSize = {x: .065, y: .32},
    jailOffset = {x: .055, topY: .1, botY: .035},
    topJailClickAreaRect = {x: .5 - jailClickSize.x/2, y: .16, w: jailClickSize.x, h: jailClickSize.y},
    botJailClickAreaRect = {x: .5 - jailClickSize.x/2, y: .58, w: jailClickSize.x, h: jailClickSize.y};

    shakerPos = {x: .63, y: .485},
    dicePosition = {
      player: { // on the right
        die1: {x: .61, y: .5},
        die2: {x: .67, y: .5}
      },
      opponent: { // on the left
        die1: {x: .21, y: .5},
        die2: {x: .27, y: .5}
      },
      fadeXOffset: .025
    },
    diceClickAreaRect = {x: dicePosition['player'].die1.x, y: dicePosition['player'].die1.y, w: .11, h: .08},
    buttonPostions = {
      brandLogo: {x: .025, y: .48},
      next: {x: .91, y: .43},
      undo: {x: .91, y: .54}
    },
    nonGameplayUiPositions = {
      playerIcon: {x: .055 , y: .80},
      playerUsername: {x: .065, y: .83},
      playerTurnIndicator: {x: .059, y: .87, w: .01, h: .008},
      opponentIcon: {x: .055 , y: .16},
      opponentUsername: {x: .065, y: .19},
      opponentTurnIndicator: {x: .059, y: .23, w: .01, h: .008}
    };


  var topTokenY = .16,
    botTokenY = .84;

  var pieceStartLocations = {
    'redJail': {
      x: botJailClickAreaRect.x + jailOffset.x,
      y: botJailClickAreaRect.y + jailOffset.botY
    },
    'blackJail': {
      x: topJailClickAreaRect.x + jailOffset.x,
      y: topJailClickAreaRect.y + jailOffset.topY
    },

    'blackScoreSpace': {
      x: .96, y: .885
    },
    'redScoreSpace': {
      x: .96, y: .39
    },

    1: {x: .8835, y: botTokenY}, // using .6575 as x seperator value
    2: {x: .827, y: botTokenY},
    3: {x: .7705, y: botTokenY},
    4: {x: .714, y: botTokenY},
    5: {x: .6575, y: botTokenY},
    6: {x: .601, y: botTokenY},

    7: {x: .449, y: botTokenY},
    8: {x: .3925, y: botTokenY},
    9: {x: .336, y: botTokenY},
    10: {x: .2795, y: botTokenY},
    11: {x: .223, y: botTokenY},
    12: {x: .1665, y: botTokenY},

    13: {x: .1665, y: topTokenY},
    14: {x: .223, y: topTokenY},
    15: {x: .2795, y: topTokenY},
    16: {x: .336, y: topTokenY},
    17: {x: .3925, y: topTokenY},
    18: {x: .449, y: topTokenY},

    19: {x: .601, y: topTokenY},
    20: {x: .6575, y: topTokenY},
    21: {x: .714, y: topTokenY},
    22: {x: .7705, y: topTokenY},
    23: {x: .827, y: topTokenY},
    24: {x: .8835, y: topTokenY}
  };

  var pieceSeperationY = .06,
    scoredPieceSeperationY = .017,
    maxMoveLocationsForOneToken = 4;

  var Board = function (params) {
    var that = new createjs.Container();

    var mainClickCallback = params.mainClickCallback,
      scale = params.scale,
      fontDefs = params.fontDefs,
      usernames = params.usernames,
      loaderQueue = params.loaderQueue;

    var diceBitmaps = {
        player: {},
        opponent: {}
      },
      fadeBitmaps = {
        player: {},
        opponent: {}
      },
      tokenBitmaps = {},
      jailBitmaps = {
        'redJail': [],
        'blackJail': []
      },
      shakerBitmap,
      selectionBitmap,
      moveIndicatorBitmapArray, knockIndicatorBitmapArray,

      buttonBitmaps = {};

    function init () {
      RenderHelper.init(scale, size);

      var simpleBoard = getSimpleBackgammonBoardFromGameBoard(params.size, params.gameState.spaces, params.gameState.pieces);

      //set images using loaderQueue
      images.board.background = loaderQueue.getItem('board_background').src;
      images.board.overlay = loaderQueue.getItem('board_overlay').src;

      _.times(6, function (i) {
        var key = 'die' + (i+1);
        images.die[key] = loaderQueue.getItem(key).src;
      });
      images.die.fade = loaderQueue.getItem('dice_fade').src

      images.pieces.black_piece = loaderQueue.getItem('black_piece').src;
      images.pieces.red_piece = loaderQueue.getItem('red_piece').src;
      images.pieces.black_piece_removed = loaderQueue.getItem('black_piece_removed').src;
      images.pieces.red_piece_removed = loaderQueue.getItem('red_piece_removed').src;

      images.buttons = {
        brandLogo: loaderQueue.getItem('brand-logo').src,
        nextBlack: loaderQueue.getItem('button-next-black').src,
        nextRed: loaderQueue.getItem('button-next-red').src,
        nextDisable: loaderQueue.getItem('button-next-inactive').src,
        roll: loaderQueue.getItem('button-roll').src,
        undoActive: loaderQueue.getItem('button-undo').src,
        undoInactive: loaderQueue.getItem('button-undo-inactive').src
      };

      images.ui = {
        blackIcon: loaderQueue.getItem('black-icon').src,
        redIcon: loaderQueue.getItem('red-icon').src
      };

      // create bitmaps
      RenderHelper.createScaledBitmapAndAddChild(images.board.background, {x:0,y:0}, that);
      RenderHelper.createScaledBitmapAndAddChild(images.board.overlay, {x:0,y:0}, that);

      //dice bitmaps
      var createDiceBitmaps = function (whichPlayer) {
        diceBitmaps[whichPlayer].die1 = RenderHelper.createScaledBitmapAndAddChild(images.die.die1, dicePosition[whichPlayer].die1, that);
        diceBitmaps[whichPlayer].die2 = RenderHelper.createScaledBitmapAndAddChild(images.die.die2, dicePosition[whichPlayer].die2, that);
      };
      createDiceBitmaps('player');
      createDiceBitmaps('opponent');

      var createFadeBitmap = function (i, whichPlayer, pos) {
        fadeBitmaps[whichPlayer][i] = RenderHelper.createScaledBitmapAndAddChild(images.die.fade, pos, that);
        fadeBitmaps[whichPlayer][i].visible = false;
      };
      var createFadeBitmaps = function (whichPlayer) {
        createFadeBitmap(1, whichPlayer, dicePosition[whichPlayer].die1);
        createFadeBitmap(2, whichPlayer, {x: dicePosition[whichPlayer].die1.x + dicePosition.fadeXOffset, y: dicePosition[whichPlayer].die1.y});
        createFadeBitmap(3, whichPlayer, dicePosition[whichPlayer].die2);
        createFadeBitmap(4, whichPlayer, {x: dicePosition[whichPlayer].die2.x + dicePosition.fadeXOffset, y: dicePosition[whichPlayer].die2.y});
      };
      createFadeBitmaps('player');
      createFadeBitmaps('opponent');

      // shaker lol
      shakerBitmap = RenderHelper.createScaledBitmapAndAddChild('assets/shaker.png', shakerPos, that);
      shakerBitmap.visible = false;

      //indicator bitmaps
      selectionBitmap = new createjs.Bitmap(indicatorImages.selection);
      selectionBitmap.visible = false;
      that.addChild(selectionBitmap);

      moveIndicatorBitmapArray = [];
      _.times(maxMoveLocationsForOneToken, function () {
        var bitmap = new createjs.Bitmap(indicatorImages.move);
        bitmap.visible = false;
        that.addChild(bitmap);
        moveIndicatorBitmapArray.push(bitmap);
      });

      knockIndicatorBitmapArray = [];
      _.times(maxMoveLocationsForOneToken, function () {
        var bitmap = new createjs.Bitmap(indicatorImages.knock);
        bitmap.visible = false;
        that.addChild(bitmap);
        knockIndicatorBitmapArray.push(bitmap);
      });

      // other ui bitmaps
      buttonBitmaps.brandLogo = RenderHelper.createScaledBitmapAndAddChild(images.buttons.brandLogo, buttonPostions.brandLogo, that);

      buttonBitmaps.next = RenderHelper.createScaledBitmapAndAddChild(images.buttons.nextDisable, buttonPostions.next, that);
      buttonBitmaps.next.on('click', function (evt) {
        console.log('next clicked');
        nextButtonClickedCallback();
      });

      buttonBitmaps.undo = RenderHelper.createScaledBitmapAndAddChild(images.buttons.undoInactive, buttonPostions.undo, that);
      buttonBitmaps.undo.on('click', function () {
        console.log('undo clicked');
        undoButtonClickedCallback();
      });
      // initialize tokenBitmaps
      _.times(24, function (n) {
        tokenBitmaps[n] = [];
      });
      tokenBitmaps['blackScoreSpace'] = [];
      tokenBitmaps['redScoreSpace'] = [];

      // draw initial tokens
      _.each(simpleBoard, function (tokenInfo, spaceId) {
        that.drawTokens(tokenInfo.player === 'p1' ? 'black' : 'red', spaceId, tokenInfo.amt);
      });

      // draw usernames text and color dot //
      function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
      }

      _.mixin({ 'capitalize': capitalize });

      var p1UsernameLabel = _.capitalize(usernames['p1'].substring(0, 12)),
        p2UsernameLabel = _.capitalize(usernames['p2'].substring(0, 12));

      RenderHelper.createScaledTextAndAddChild(p1UsernameLabel, fontDefs.usernameFont, nonGameplayUiPositions.playerUsername, that);
      RenderHelper.createScaledTextAndAddChild(p2UsernameLabel, fontDefs.usernameFont, nonGameplayUiPositions.opponentUsername, that);

      buttonBitmaps.playerIcon = RenderHelper.createScaledBitmapAndAddChild(images.ui.blackIcon, nonGameplayUiPositions.playerIcon, that);
      buttonBitmaps.opponentIcon = RenderHelper.createScaledBitmapAndAddChild(images.ui.redIcon, nonGameplayUiPositions.opponentIcon, that);

      buttonBitmaps.playerTurnIndicator = RenderHelper.drawRect(nonGameplayUiPositions.playerTurnIndicator, '#ffffff', that);
      buttonBitmaps.opponentTurnIndicator = RenderHelper.drawRect(nonGameplayUiPositions.opponentTurnIndicator, '#ffffff', that);
      buttonBitmaps.playerTurnIndicator.visible = false;
      buttonBitmaps.opponentTurnIndicator.visible = false;

      /////////
      that.on('click', function (evt) {
        that.clickedSpace(evt.stageX, evt.stageY);
      });
    }

    var isTopSpace = function (spaceId) {
      return Number(spaceId) > 12 || spaceId === 'blackScoreSpace' || spaceId === 'redJail';
    };


    // tokensOnSpot is how many tokens were on the space before adding a new one.
    var getTokenPixelPosition = function (spaceId, tokensOnSpot) {
      if (spaceId === 'blackScoreSpace' || spaceId === 'redScoreSpace') {
        return RenderHelper.getScaledPos(pieceStartLocations[spaceId].x - tokenOffset.x, pieceStartLocations[spaceId].y + scoredPieceSeperationY * tokensOnSpot - .27);
      }

      var normalizedStartLocation = {
          x: pieceStartLocations[spaceId].x - tokenOffset.x,
          y: pieceStartLocations[spaceId].y - tokenOffset.y
        },
        upOrDownModifier = (spaceId === 'redJail' || parseInt(spaceId) > 12) ? 1 : -1,
        yOffsetDueToTokensAmount;

      // Piece Stacking for over 5 pieces per space
      // 1 - 5 follow normal pattern
      // 6 - 9    add .5*pieceSeperationY
      // 10 - 12  add pieceSeperationY
      // 13 - 14  add 1.5*pieceSeperationY
      // 15       add 2*pieceSeperationY
      if (tokensOnSpot < 5) {
        yOffsetDueToTokensAmount = tokensOnSpot * pieceSeperationY;
      } else if (tokensOnSpot < 9) {
        yOffsetDueToTokensAmount = (tokensOnSpot - 5) * pieceSeperationY + pieceSeperationY*.5;
      } else if (tokensOnSpot < 12) {
        yOffsetDueToTokensAmount = (tokensOnSpot - 9) * pieceSeperationY + pieceSeperationY;
      } else if (tokensOnSpot < 14) {
        yOffsetDueToTokensAmount = (tokensOnSpot - 12) * pieceSeperationY + pieceSeperationY*1.5;
      } else if (tokensOnSpot < 15) {
        yOffsetDueToTokensAmount = (tokensOnSpot - 14) * pieceSeperationY + pieceSeperationY*2;
      }

      return RenderHelper.getScaledPos(normalizedStartLocation.x, normalizedStartLocation.y + yOffsetDueToTokensAmount * upOrDownModifier);
    };

    var getTokenBitmapArray = function (spaceId) {
      if (!isNaN(parseInt(spaceId))) {
          return tokenBitmaps[parseInt(spaceId) - 1];
        } else if (tokenBitmaps[spaceId]) {
          return tokenBitmaps[spaceId];
        } else {
          //lol
          return jailBitmaps[spaceId];
        }
    };

    var reorderBotTokens = function (tokenBitmapsArray) {
      // UGHly function, we need to bring the stacks to the front
      //   starting with the top most token layer (5/4/3/2/1)
      //   most stacks will be the bottom layer (5)
      //   and for each layer, we need to bring them to the front
      //   in the reverse order they are in the array
      // PRETTIER z-indexing, (but at what cost?)
      var i,
        amt = tokenBitmapsArray.length,
        maxZ = that.getNumChildren() - 1;
      for (i=4;i>=0;i--) {
        if (!tokenBitmapsArray[i]) continue;
        that.setChildIndex(tokenBitmapsArray[i], maxZ);
      }
      for (i=8;i>=5;i--) {
        if (!tokenBitmapsArray[i]) continue;
        that.setChildIndex(tokenBitmapsArray[i], maxZ);
      }
      for (i=11;i>=9;i--) {
        if (!tokenBitmapsArray[i]) continue;
        that.setChildIndex(tokenBitmapsArray[i], maxZ);
      }
      for (i=13;i>=12;i--) {
        if (!tokenBitmapsArray[i]) continue;
        that.setChildIndex(tokenBitmapsArray[i], maxZ);
      }
      for (i=14;i>=14;i--) { //lol
        if (!tokenBitmapsArray[i]) continue;
        that.setChildIndex(tokenBitmapsArray[i], maxZ);
      }
    };

    that.drawTokens = function (color, loc, amt) {
      var i,
        tokenBitmapsArray = getTokenBitmapArray(loc);
      //console.log('drawing initial tokens at ' + loc);

      for (i=0; i<amt; i++) {
        var src = images.pieces[color === 'red' ? 'red_piece' : 'black_piece'];

        if (loc === 'redScoreSpace') {
          src = images.pieces.red_piece_removed;
        } else if (loc === 'blackScoreSpace') {
          src = images.pieces.black_piece_removed;
        }

        var newBitmap = RenderHelper.createScaledBitmap(src),
          pos = getTokenPixelPosition(loc, i);

        newBitmap.x = pos.x;
        newBitmap.y = pos.y;
        that.addChild(newBitmap);

        // adjust token bitmap arrays
        tokenBitmapsArray.push(newBitmap);
      }

      if (!isTopSpace(loc)) {
        reorderBotTokens(tokenBitmapsArray);
      }
    };

    that.moveToken = function (currentSpaceId, destSpaceId) {
      var currentSpaceTokenBitmapArray = getTokenBitmapArray(currentSpaceId),
        aToken = currentSpaceTokenBitmapArray.pop();

        if (aToken) {
          var nextSpaceTokenBitmapArray = getTokenBitmapArray(destSpaceId),
            pos = getTokenPixelPosition(destSpaceId, nextSpaceTokenBitmapArray.length);
          aToken.x = pos.x;
          aToken.y = pos.y;
          nextSpaceTokenBitmapArray.push(aToken);

          // set z-ordering
          if (isTopSpace(destSpaceId)) { // top
            // only need to ensure the last added is above the other
            //  tokens on the space (and everything else)
            that.setChildIndex(aToken, that.getNumChildren() - 1);
          } else { // bottom
            // the movedToken needs to be below the other tokens on the same space and above
            // stack level (5/4/3/2/1) but above the below stack levels
            //that.swapChildrenAt
            reorderBotTokens(nextSpaceTokenBitmapArray);
          }

          // change sprite piece scored
          if (destSpaceId === 'redScoreSpace') {
            aToken.image.src = images.pieces.red_piece_removed;
          } else if (destSpaceId === 'blackScoreSpace') {
            aToken.image.src = images.pieces.black_piece_removed;
          }
        } else {
          throw 'CANT move no tokens';
        }
    };

    var isBetween = function (num, low, high) {
      return num >= low && num <= high;
    };
    that.showShaker = function (trueOrFalse) {
      trueOrFalse = typeof(trueOrFalse) !== 'undefined' ? trueOrFalse : true; // use true if no trueOrFalse parameter
      shakerBitmap.visible = !!trueOrFalse;
    };

    that.clickedSpace = function (x, y) {
      var clickPos = {x: x, y: y};

      // check spaces
      _.each(pieceStartLocations, function (startLocation, pieceNumber) {
        var spaceRect = {
          x: startLocation.x + tokenClickAreaPosOffset.x,
          y: startLocation.y + (pieceNumber > 12 ? tokenClickAreaPosOffset.topY : tokenClickAreaPosOffset.botY),
          w: tokenClickAreaSize.x,
          h: tokenClickAreaSize.y
        };

        if (isNaN(pieceNumber) && pieceNumber !== 'blackScoreSpace' && pieceNumber !== 'redScoreSpace') { return; }

        //RenderHelper.drawDebugRect(spaceRect, that);
        if (RenderHelper.isWithinScaledRect(clickPos, spaceRect)) {
          mainClickCallback(pieceNumber);
        }
      });

      // check dice spot
      //RenderHelper.drawDebugRect(diceClickAreaRect, that);
      if (RenderHelper.isWithinScaledRect(clickPos, diceClickAreaRect)) {
        mainClickCallback('dice');
      }

      // check top jail
      //RenderHelper.drawDebugRect(topJailClickAreaRect, that);
      if (RenderHelper.isWithinScaledRect(clickPos, topJailClickAreaRect)) {
        mainClickCallback('botJail');
      }

      // check bottom jail
      //RenderHelper.drawDebugRect(botJailClickAreaRect, that);
      if (RenderHelper.isWithinScaledRect(clickPos, botJailClickAreaRect)) {
        mainClickCallback('topJail');
      }
    };

    var showRoll = function (whichPlayer, roll) {
      console.log(whichPlayer + ' Roll: ' + roll.die1 + ' ' + roll.die2);
      diceBitmaps[whichPlayer].die1.visible = true;
      diceBitmaps[whichPlayer].die2.visible = true;
      diceBitmaps[whichPlayer].die1.image.src = images.die['die' + roll.die1];
      diceBitmaps[whichPlayer].die2.image.src = images.die['die' + roll.die2];
    };

    var hideRoll = function (whichPlayer) {
      diceBitmaps[whichPlayer].die1.visible = false;
      diceBitmaps[whichPlayer].die2.visible = false;
      fadeBitmaps[whichPlayer][1].visible = false;
      fadeBitmaps[whichPlayer][2].visible = false;
      fadeBitmaps[whichPlayer][3].visible = false;
      fadeBitmaps[whichPlayer][4].visible = false;
    };

    that.showPlayerRoll = function (roll) {
      showRoll('player', roll);
    };

    that.hidePlayerRoll = function () {
      hideRoll('player');
    };

    that.showOpponentRoll = function (roll) {
      showRoll('opponent', roll);
      fadeBitmaps['opponent'][1].visible = false;
      fadeBitmaps['opponent'][2].visible = false;
      fadeBitmaps['opponent'][3].visible = false;
      fadeBitmaps['opponent'][4].visible = false;
    };

    that.hideOpponentRoll = function () {
      hideRoll('opponent');
    };

    var baseFadeDie = function (whichPlayer, dieNumber, isDoubles, enabled) {
      if (!isDoubles) {
        fadeBitmaps[whichPlayer][dieNumber === 1 ? 1 : 3].visible = enabled;
        fadeBitmaps[whichPlayer][dieNumber === 1 ? 2 : 4].visible = enabled;
      } else {
        fadeBitmaps[whichPlayer][dieNumber].visible = enabled;
      }
    };

    that.fadePlayerDie = function (dieNumber, isDoubles) {
      baseFadeDie('player', dieNumber, isDoubles, true);
    };

    that.unfadePlayerDie = function (dieNumber, isDoubles) {
      baseFadeDie('player', dieNumber, isDoubles, false);
    };

    that.fadeOpponentRoll = function () {
      fadeBitmaps['opponent'][1].visible = true;
      fadeBitmaps['opponent'][2].visible = true;
      fadeBitmaps['opponent'][3].visible = true;
      fadeBitmaps['opponent'][4].visible = true;
    };

    //////// INDICATORS //////////////
    that.showSelection = function (spaceId) {
      console.log('showSelection');

      var spaceCenterCoords = getTokenPixelPosition(spaceId, 3);
      selectionBitmap.x = spaceCenterCoords.x - 80;
      selectionBitmap.y = spaceCenterCoords.y;
      selectionBitmap.visible = true;
    };

    that.stopSelection = function () {
      console.log('stopSelection')
      selectionBitmap.visible = false;
    };

    that.showMoveLocationSpaces = function (spaceIdArray) {
      console.log('showMoveLocationSpaces ' + JSON.stringify(spaceIdArray));
      var i = 0;
      _.each(spaceIdArray, function (spaceId) {
        var spaceCenterCoords = getTokenPixelPosition(spaceId, 3),
          bitmap = moveIndicatorBitmapArray[i++];
        bitmap.x = spaceCenterCoords.x - 80;
        bitmap.y = spaceCenterCoords.y;
        bitmap.visible = true;
      });
    };

    that.stopMoveLocationSpaces = function () {
      _.each(moveIndicatorBitmapArray, function (bitmap) {
        bitmap.visible = false;
      });
    };

    that.showKnockMoveLocationSpaces = function (spaceIdArray) {
      console.log('showKnockMoveLocationSpaces ' + JSON.stringify(spaceIdArray));
      var i = 0;
      _.each(spaceIdArray, function (spaceId) {
        var spaceCenterCoords = getTokenPixelPosition(spaceId, 3),
          bitmap = knockIndicatorBitmapArray[i++];
        bitmap.x = spaceCenterCoords.x - 80;
        bitmap.y = spaceCenterCoords.y;
        bitmap.visible = true;
      });
    };

    that.stopKnockMoveLocationSpaces = function () {
      _.each(knockIndicatorBitmapArray, function (bitmap) {
        bitmap.visible = false;
      });
    };

    that.stopAllMoveLocationIndicators = function () {
      that.stopSelection();
      that.stopMoveLocationSpaces();
      that.stopKnockMoveLocationSpaces();
    };

    that.showFloatingWhosTurnLabel = function (playerRel) {
      $('#turnlabel').html(_.capitalize(usernames[playerRel]) + '\'s Turn ');
      $('.whoturn-popup').fadeIn(1000, function () {
        $('.whoturn-popup').fadeOut(3000);
      });

      if (playerRel === 'p1') {
        buttonBitmaps.playerTurnIndicator.visible = true;
        buttonBitmaps.opponentTurnIndicator.visible = false;
      } else if (playerRel === 'p2') {
        buttonBitmaps.playerTurnIndicator.visible = false;
        buttonBitmaps.opponentTurnIndicator.visible = true;
      }
    };

    ///////// NEXT-ROLL/UNDO BUTTON /////////

    that.setDisabledNextButton = function () {
      buttonBitmaps.next.image.src = images.buttons.nextDisable;
    };

    that.setEnabledNextButton = function (playerRel) {
      if (playerRel === 'p1') {
        buttonBitmaps.next.image.src = images.buttons.nextBlack;
      } else {
        buttonBitmaps.next.image.src = images.buttons.nextRed;
      }
    };

    that.setRollNextButton = function () {
      buttonBitmaps.next.image.src = images.buttons.roll;
    };

    that.setUndoAvailable = function () {
      buttonBitmaps.undo.image.src = images.buttons['undoActive'];
    };

    that.setUndoUnavailable = function () {
      buttonBitmaps.undo.image.src = images.buttons['undoInactive'];
    };

    var nextButtonClickedCallback,
      undoButtonClickedCallback;
    that.setClickedCallbacks = function (params) {
      nextButtonClickedCallback = params.next;
      undoButtonClickedCallback = params.undo
    };

    ////////////////////////////////////

    init();
    return that;
  };

  var getSimpleBackgammonBoardFromGameBoard = function (size, spaces, pieces) {

    var board = {};

    _.each(spaces, function (value) {
      var loc = value.boardSpaceId;
      board[loc] = {}
    });

    _.each(pieces, function (value) {
      board[value.locationId].player = value.ownerId;
      board[value.locationId].amt = board[value.locationId].amt ? board[value.locationId].amt + 1 : 1;
    });

    return board;
  };

  return Board;
});
