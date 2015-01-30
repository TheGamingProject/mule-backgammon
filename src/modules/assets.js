
define(function(){
  var validThemes = ['classic', 'camfrog', 'diablo'];

  return function (theme) {
    if (!_.contains(validThemes, theme)) {
      // default to using the 'classic' theme
      theme = 'classic';
    }

    var path = 'assets/' + theme + '/',

      usernameColor = '#ffffff';

    switch (theme) {
      case 'classic':
        break;
      case 'camfrog':
        break;
      case 'diablo':
        break;
    };

    return {
      fonts: {
        "usernameFont": {
          fontFamily: "Open Sans Condensed Light",
          color: usernameColor,
          size: 28
        }
      },
      images: [
        {src: path + 'board-main.png', id: 'board_background'},
        {src: path + 'board-overlay.png', id: 'board_overlay'},

        {src: path + 'dice-1.png', id: 'die1'},
        {src: path + 'dice-2.png', id: 'die2'},
        {src: path + 'dice-3.png', id: 'die3'},
        {src: path + 'dice-4.png', id: 'die4'},
        {src: path + 'dice-5.png', id: 'die5'},
        {src: path + 'dice-6.png', id: 'die6'},
        {src: 'assets/fadeRect.png', id: 'dice_fade'},

        {src: path + 'checker-p1.png', id: 'red_piece'},
        {src: path + 'checker-p2.png', id: 'black_piece'},
        {src: path + 'checker-p1-removed.png', id: 'red_piece_removed'},
        {src: path + 'checker-p2-removed.png', id: 'black_piece_removed'},

        {src: path + 'brand-logo.png', id: 'brand-logo'},
        {src: path + 'icon-p2.png', id: 'black-icon'},
        {src: path + 'icon-p1.png', id: 'red-icon'},

        {src: path + 'button-next-inactive.png', id: 'button-next-inactive'},
        {src: path + 'button-next-active-p2.png', id: 'button-next-black'},
        {src: path + 'button-next-active-p1.png', id: 'button-next-red'},
        {src: path + 'button-roll.png', id: 'button-roll'},
        {src: path + 'button-undo.png', id: 'button-undo'},
        {src: path + 'button-undo-inactive.png', id: 'button-undo-inactive'},



        {src: 'assets/shaker.png', id: 'shaker'},

        {src: 'assets/indicator-selection.png', id: 'indicator-selection'},
        {src: 'assets/indicator-move.png', id: 'indicator-move'},
        {src: 'assets/indicator-knock.png', id: 'indicator-knock'}
      ],

      sounds: []
    };
  };
});
