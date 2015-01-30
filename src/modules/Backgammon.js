
define(['../../mule-js-sdk/sdk', 'BackgammonLogic', 'BackgammonState'], function (sdk, BackgammonLogic, BackgammonState) {
  return function (myPlayerRel, whosTurn, gameState, boardDisplayObject, submitTurnCallback) {
    var that = {},
      SDK = sdk('../../'),
      myRelId = myPlayerRel,
      opponentRelId = (myRelId === 'p1') ? 'p2' : 'p1',
      currentBgState = BackgammonState(SDK, gameState, myRelId),
      board = boardDisplayObject,

      bgState, // awaitingRoll, rolled (includes if you have pending moves), waitingOnOpponent
      lastRoll = {}, rollsLeft = [];

    var init = function () {
      lastRoll = currentBgState.getCurrentRoll();

      board.hidePlayerRoll();
      board.hideOpponentRoll();

      if (whosTurn === myRelId) {
        bgState = 'awaitingRoll';
        board.showShaker();
        board.setRollNextButton();
        showPlayerRoll();
        setPlayerRoll();
      } else {
        bgState = 'waitingOnOpponent';
        showOpponentRoll();
      }

      board.showFloatingWhosTurnLabel(whosTurn);

      board.setClickedCallbacks({next: nextButtonClicked, undo: undoButtonClicked});
    };

    var isDoubles = function () {
      return lastRoll.die1 === lastRoll.die2;
    };

    var showPlayerRoll = function () {
      board.showPlayerRoll(lastRoll);
    };

    var showOpponentRoll = function () {
      board.showOpponentRoll(lastRoll);
    };

    var setPlayerRoll = function () {
      rollsLeft = [lastRoll.die1, lastRoll.die2];
      if (isDoubles()) {
        rollsLeft.push(lastRoll.die1, lastRoll.die2);
      }
      console.log('setRollsLeft: ' + JSON.stringify(rollsLeft));
    };

    var removeRolls = function (rollsUsed) {
      _.each(rollsUsed, function (roll) {
        rollsLeft.splice(_.indexOf(rollsLeft, roll), 1);
      });
    };

    var fadePlayerDie = function (rollUsed) {
      if (!isDoubles()) {
        board.fadePlayerDie(lastRoll.die1 === rollUsed ? 1 : 2, false);
      } else {
        board.fadePlayerDie(4 - rollsLeft.length, true);
      }
    };

    var unfadePlayerDie = function (rollUsed) {
      if (!isDoubles()) {
        board.unfadePlayerDie(lastRoll.die1 === rollUsed ? 1 : 2, false);
      } else {
        board.unfadePlayerDie(4 - rollsLeft.length, true);
      }
    };

    var getOnePieceIdOnSpace = function (spaceId, playerRel) {
      var playersPieces = currentBgState.getPiecesOnSpace(spaceId, playerRel);

      if (playersPieces.length > 0) {
        return playersPieces[0].id;
      } else {
        return undefined;
      }
    };

    var getOneFriendlyPieceIdOnSpace = function (spaceId) {
      return getOnePieceIdOnSpace(spaceId, myRelId);
    };

    var getOneEnemyPieceIdOnSpace = function (spaceId) {
      return getOnePieceIdOnSpace(spaceId, opponentRelId);
    };

    var getEnemysCountOnSpace = function (spaceId) {
      var playersPieces = currentBgState.getPiecesOnSpace(spaceId, opponentRelId);

      return playersPieces.length;
    };

    ////////// TURN LOGIC //////////

    // if jailed
    var unjailBlocked;
    var checkIfCantMove = function () {
      var playerJailId = myRelId === 'p1' ? 'blackJail' : 'redJail',
        rollsOutOfJailLeft = _.clone(rollsLeft),
        jailedTokensCount = currentBgState.getPiecesOnSpace(playerJailId).length,
        moveableCount = 0,
        gammonAreaEnemyTokensArray = currentBgState.getGammonAreaPieceArray(opponentRelId, opponentRelId);

      // check if any jailed can move with the rolls
      _.each(rollsOutOfJailLeft, function (roll) {
        if (gammonAreaEnemyTokensArray[roll - 1].length <= 1) {
          jailedTokensCount--;
          moveableCount++;
        }
      });
      console.log('blocked tokens: ' + jailedTokensCount);

      if (jailedTokensCount > 0 && moveableCount === 0) {
        console.log('cannot unjail..');
        unjailBlocked = true;
        submittable = true;
        board.setEnabledNextButton(myRelId);
      } else { unjailBlocked = false; }
    };

    var turnSubmittedIsMine = function (turn) { // TODO find some real names for these functions
      // it was my turn, so now its their turn, so display their roll
      bgState = 'waitingOnOpponent';

      lastRoll = currentBgState.getCurrentRoll();
      showOpponentRoll();
      board.hidePlayerRoll();
      board.showFloatingWhosTurnLabel(opponentRelId);
    };

    var turnSubmittedIsOpponents = function (turn) {
      // move knocks
      _.each(turn.metadata.knockedPieces, function (info) {
        board.moveToken(info.fromSpaceId, myRelId === 'p1' ? 'blackJail' : 'redJail');
      });

      _.each(turn.params.moveTokens, function (moveTokenActionParams) {
        var finalDestSpaceId = moveTokenActionParams.spaceId[moveTokenActionParams.spaceId.length - 1];
        board.moveToken(moveTokenActionParams.currentPieceSpace, finalDestSpaceId);
        console.log('they moved a token from ' + moveTokenActionParams.currentPieceSpace + ' to ' + moveTokenActionParams.spaceId);
      })

      // it was their turn, so now its your turn, show the move then show shaker and allow rolling
      bgState = 'awaitingRoll';
      board.showShaker();
      board.setRollNextButton();

      lastRoll = currentBgState.getCurrentRoll();;
      setPlayerRoll();
      showPlayerRoll();
      board.showFloatingWhosTurnLabel(myRelId);
      board.fadeOpponentRoll();
    };

    var addPendingAction = function (action, knockTempMove) {
      currentBgState.addPendingMoveAction(action, knockTempMove);

      if (currentBgState.isPendingTurnComplete(isDoubles())) {
        // enable submit button
        submittable = true;
        board.setEnabledNextButton(myRelId);
      }
    };

    // returns then .params of MoveAction
    that.getPendingTurn = function () { return currentBgState.getPendingTurn(); };

    that.resetPendingTurn = function () {
    };

    ////////// UI INTERACTION //////////

    var clickShaker = function () {
      // show dice
      showPlayerRoll();

      bgState = 'rolled';
      board.showShaker(false);
      board.setDisabledNextButton();

      checkIfCantMove();
    };

    var unselection = function () {
        board.stopAllMoveLocationIndicators();
        spaceClicked = null;
    };

    var clickNewSelection = function (clickedSpaceId)  {
      // selection
      pieceIdClicked = getOneFriendlyPieceIdOnSpace(clickedSpaceId);
      if (isNaN(pieceIdClicked) || clickedSpaceId === 'blackScoreSpace' || clickedSpaceId === 'redScoreSpace') {
        return;
      }

      spaceClicked = clickedSpaceId;
      console.log('clicked to move from ' + clickedSpaceId + ', piece: ' + pieceIdClicked);
      board.showSelection(clickedSpaceId);

      possibleMoveLocations = BackgammonLogic.getPossibleMoveLocations({
        spaceId: clickedSpaceId,
        rollsLeft: rollsLeft,
        allTokensInGammonArea: currentBgState.isPlayerReadyToScore(),
        blackOrRed: myRelId === 'p1' ? 'black' : 'red'
      });

      var knockLocationIds = [],
        possibleMoveLocationsIds = _.filter(_.keys(possibleMoveLocations), function (pmlSpaceId) {
          var opponentTokensCount = getEnemysCountOnSpace(pmlSpaceId);

          if (opponentTokensCount === 1) { knockLocationIds.push(pmlSpaceId) };
          return opponentTokensCount === 0;
        });

      board.showMoveLocationSpaces(possibleMoveLocationsIds);
      if (knockLocationIds.length > 0) {
        board.showKnockMoveLocationSpaces(knockLocationIds);
      }
    };

    var clickWithSelection = function (clickedSpaceId) {
      // unselection
      if (spaceClicked === clickedSpaceId) {
        console.log('unselecting');
        unselection();
        return;
      }

      // attempted movement
      var isMoveAllowed = false,
        rollsUsed;
      _.each(possibleMoveLocations, function (_rollsUsed, moveLocationSpaceId) {
        if (moveLocationSpaceId === clickedSpaceId) {
          isMoveAllowed = true;
          rollsUsed = _rollsUsed;
        };
      });
      var opponentTokensOnDestSpace = currentBgState.getPiecesOnSpace(clickedSpaceId, opponentRelId),
        knock;
      if (isMoveAllowed && opponentTokensOnDestSpace.length <= 1) {
        console.log('clicked to move to ' + clickedSpaceId);

        if (opponentTokensOnDestSpace.length === 1) {
          // knock opponent token to jail
          console.log('knocking opponent');

          knock = {
            pieceId: opponentTokensOnDestSpace[0].id,
            jailSpaceId: myRelId === 'p1' ? 'redJail' : 'blackJail'
          };
          board.moveToken(clickedSpaceId, knock.jailSpaceId);
        }
        board.moveToken(spaceClicked, clickedSpaceId);

        unselection();

        var rollUsed = rollsUsed[0]; // BackgammonState only allows adding one moveToken subAction at a time

        // set pending turn
        addPendingAction({
          rollUsed: rollUsed,
          pieceId: pieceIdClicked,
          spaceId: clickedSpaceId
        }, knock);

        removeRolls(rollsUsed);
        fadePlayerDie(rollUsed);

        checkIfCantMove();

        console.log('pendingTurn: ');
        console.log(currentBgState.getPendingTurn());
        console.log('rollsLeft: ');
        console.log(rollsLeft);

        board.setUndoAvailable();
      } else {
        // if its not a possible move, select that token (if available) or deselect
        console.log('invalid spot');
        unselection();
        clickNewSelection(clickedSpaceId);
      }
    };

    var spaceClicked,
      pieceIdClicked,
      possibleMoveLocations;
    var clickedMovableSpace = function (spaceId) {
      if (currentBgState.isPendingTurnComplete(isDoubles()) || unjailBlocked) {
        return;
      }

      //unjail first
      var playerJailId = myRelId === 'p1' ? 'blackJail' : 'redJail',
        jailedFriendlyTokens = currentBgState.getPiecesOnSpace(playerJailId);
      if (jailedFriendlyTokens.length > 0 && spaceId !== playerJailId && !spaceClicked) {
        console.log('move jailed units first')
        return;
      }

      if (!spaceClicked) {
        clickNewSelection(spaceId);
      } else {
        clickWithSelection(spaceId);
      }
    };

    that.clickSpace = function (space) {
      if (space === 'topJail') { space = 'redJail'; }
      if (space === 'botJail') { space = 'blackJail'; }

      console.log('clicked space: ' + space);

      switch (bgState) {
        case 'awaitingRoll':
          if (space === 'dice') {
            clickShaker();
          }
          break;
        case 'rolled':
          if (!isNaN(parseInt(space)) || space === 'blackJail' || space === 'redJail' || space === 'blackScoreSpace' || space === 'redScoreSpace') {
            clickedMovableSpace(space);
          }
          break;
      }
    };

    /////////////////////////////

    that.updateGameState = function (_gameState) {
      currentBgState.setNewTurnState(_gameState);
    };

    that.parseTurn = function (playerRel, turn) {
      console.log('new turn fetched: ' + playerRel);
      turn = turn.actions[0];
      console.log(turn);

      if (playerRel === myRelId) {
        turnSubmittedIsMine(turn);
      } else {
        turnSubmittedIsOpponents(turn);
      }
    }

    var submittable = false;
    var nextButtonClicked = function () {
      if (bgState === 'rolled' && submittable) {
        submitTurnCallback(that.getPendingTurn(), function () {
          submittable = false;
          board.setDisabledNextButton();
          board.setUndoUnavailable();
        }, function (err) {
          submittable = true;
          board.setEnabledNextButton();
        });
      }

      if (bgState === 'awaitingRoll') {
        clickShaker();
      }
    };

    var undoTurn = function () {
      var pendingTurn = currentBgState.getPendingTurn();
      var undoInfo = currentBgState.undoPendingMove();

      console.log('undo: ' + undoInfo.pendingTurnSpaceId + ' -> ' + undoInfo.backToSpaceId)
      board.moveToken(undoInfo.pendingTurnSpaceId, undoInfo.backToSpaceId);

      // re-add used roll
      unfadePlayerDie(undoInfo.rollUsed);
      rollsLeft.push(undoInfo.rollUsed);

      // undo knocked
      if (undoInfo.knock) {
        board.moveToken(undoInfo.knock.jailSpaceId, undoInfo.pendingTurnSpaceId);
      }

      if (currentBgState.getPendingMovesAmount() === 0) {
        board.setUndoUnavailable();
      }

      // unlite submit button
      if (submittable) {
        submittable = false;
        board.setDisabledNextButton();
      }

      if (unjailBlocked) {
        unjailBlocked = false;
      }
    };

    var undoButtonClicked = function () {
      var pendingTurn = currentBgState.getPendingTurn();
      if (bgState === 'rolled' && !!pendingTurn && pendingTurn.moveTokens.length > 0) {
        undoTurn();
      }
    };

    init();
    return that;
  };
});
