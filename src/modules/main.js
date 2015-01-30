/*
 * main.js
 * - loads assets & inits mule Spinal
 * - then hands control over to Backgammon/Board
 */

var GAME = {};
GAME.SIZE = { x: 1280, y: 960 };


define(["Loader", "assets", 'Backgammon', "Board", 'mule-sdk'],
  function(Loader, generateAssets, Backgammon, Board, sdk){
    var SDK = sdk('../../'),
      Spinal = SDK.Spinal();

    var themeFromUrl = SDK.utils.getUrlParameter('theme'),
      scale = (SDK.utils.getUrlParameter('scale') || 65) / 100,
      ourAssets = generateAssets(themeFromUrl);

    var STATES = {pregame: 0, ingame: 1, loading: 2};

    GAME.fps = 30;
    GAME.state;

    var userPlayerRel,
      playerMap,
      ourBackgammon,
      isGameOver = false,
      firstLoad = true,

      whosTurn,
      submittable = false;

    GAME.init = function(canvas){
      GAME.stage = canvas;
      GAME.state = STATES.pregame;
      GAME.SIZE.x *= scale;
      GAME.SIZE.y *= scale;

      $('#myCanvas').attr('width', GAME.SIZE.x);
      $('#myCanvas').attr('height', GAME.SIZE.y);

      GAME.startGame();
    };

    var updateWhosTurnIsIt = function () {
      var nextWhosTurn = SDK.Historys.getWhosTurnIsIt(Spinal.getHistory());
      if (whosTurn !== nextWhosTurn) {
        if (nextWhosTurn === userPlayerRel) {
          console.log('beginPlayersTurn');
          Spinal.stopRefresh();
        } else {
          console.log('beginOpponentTurn');
        }
        whosTurn = nextWhosTurn;
      }
    };

    var newTurnHook = function (result) {
      playerMap = Spinal.getPlayersMap();
      ourBackgammon.updateGameState(result.gameState);
      parseTurn(result.turn);
      updateDebugLabel();
    };

    var submitTurn = function (pendingTurn, successCallback, failureCallback) {
      console.log('submitting turn');
      if (pendingTurn === null) return;

      var actions = [{
        type: 'TurnAction',
        params: pendingTurn
      }];

      Spinal.submitTurnQ(actions)
        .then(function (result) {
          console.log('Submitted turn');
          console.log(result);
          // refresh? - nah wait for us to fetch the turn
          successCallback(); // makes unsubmittabled
          //TODO lock the submit & reset button
        })
        .fail(function (err) {
          if (failureCallback) { failureCallback(err); }
          alert(JSON.stringify(err));
        });

      Spinal.startRefresh();
    };

    var parseTurn = function (turn) {
      var playerRel, singleTurn;
      _.each(turn.playerTurns, function (t, p) {
        playerRel = p; // this should only loop once
        singleTurn = t;
      });
      ourBackgammon.parseTurn(playerRel, singleTurn);
    };

    var updateDebugLabel = function () {
      var isPlayer1Turn = !playerMap['p1'].played,
        whosTurnLabel = (whosTurn === userPlayerRel) ? 'YOUR TURN' : 'their turn';
      $('#debugLabel').html('turn: ' + Spinal.getCurrentTurnNumber() + ', ' + whosTurnLabel);
    };

    GAME.startGame = function () {
      GAME.state = STATES.ingame;

      console.log("end pregame state");

      var boardViewParams = {
          scale: scale,
          gameBoard: Spinal.getGameBoard(),
          gameState: Spinal.getGameState(),
          mainClickCallback: clickSpace,
          fontDefs: ourAssets.fonts,
          usernames: {p1: playerMap.p1.name, p2: playerMap.p2.name},
          loaderQueue: loaderQueue
        },
        newBoardView = Board(boardViewParams);
      GAME.stage.addChild(newBoardView);

      ourBackgammon = Backgammon(
        Spinal.getUserPlayerRel(),
        SDK.Historys.getWhosTurnIsIt(Spinal.getHistory()),
        Spinal.getGameState(),
        newBoardView,
        submitTurn
      );
    };

    var clickSpace = function (space) {
      ourBackgammon.clickSpace(space);
    };

    ////////// MAIN /////////////
    var canvas, loaderQueue;
    var init = function (userId) {
      canvas = new createjs.Stage(document.getElementById('myCanvas'));
      canvas.enableMouseOver({frequency: 30});

      //trying: http://stackoverflow.com/questions/20805311/what-is-the-best-practice-in-easeljs-for-ticker
      createjs.Ticker.setFPS(30);
      createjs.Ticker.addEventListener("tick", canvas);

      document.onkeydown = GAME.keyPressed;
      document.onkeyup = GAME.keyReleased;

      //load!
      console.log("loading");
      Loader.doLoadScreen(
        canvas,
        ourAssets.images,
        ourAssets.sounds,
        function (_loaderQueue){
          loaderQueue = _loaderQueue;
          console.log("done loading assets");
          initMuleSpinal();
        }
      );

    }

    var initMuleSpinal = function () {
      var config = {
        refreshTime: 3000,
        turnSubmitStyle: 'roundRobin',
        gameIdUrlKey: 'gameId',
        useSessionForUserId: true,
        newTurnHook: newTurnHook,
        noSessionHook: noSessionHook
      };

      Spinal.initQ(config)
        .then(function (result) {
          console.log('Spinal initted');
          console.log(result)
          userPlayerRel = Spinal.getUserPlayerRel();
          playerMap = Spinal.getPlayersMap();
          GAME.init(canvas);
          Spinal.startRefresh();
          updateDebugLabel();
        });
    };

    var noSessionHook = function () {
      alert('You are not Logged in...redirecting to MuleFrontend.');
      window.location.replace('../../../')
    };

    console.log("init-ing");
    init();
  });
