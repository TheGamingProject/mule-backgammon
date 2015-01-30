
define(function () {
  var that = {};

  var scale, scaledViewPortSize

  that.init = function (_scale, viewPortSize) {
    scale = _scale;
    scaledViewPortSize = {x: scale * viewPortSize.x, y: scale * viewPortSize.y};
  };

  // fontDef is from assets.js
  // normalizedPosition is the center of the text
  that.createScaledTextAndAddChild = function (textString, fontDef, normalizedPosition, stage) {
    if(!fontDef) {
      throw "invalid font..." + fontDef;
    }

    var newText = new createjs.Text(
      textString || '',
      fontDef.size + 'px ' + fontDef.fontFamily,
      fontDef.color
    );

    newText.textAlign = 'center';

    newText.x = normalizedPosition.x * scaledViewPortSize.x;
    newText.y = normalizedPosition.y * scaledViewPortSize.y;
    newText.scaleX = scale;
    newText.scaleY = scale;

    stage.addChild(newText);
  };

  that.createScaledBitmap = function (bitmapSrc, normalizedPosition) {
    normalizedPosition = normalizedPosition || {x: 0, y: 0};

    var newBitmap = new createjs.Bitmap(bitmapSrc);
    newBitmap.x = normalizedPosition.x * scaledViewPortSize.x;
    newBitmap.y = normalizedPosition.y * scaledViewPortSize.y;
    newBitmap.scaleX = scale;
    newBitmap.scaleY = scale;

    return newBitmap;
  };

  that.createScaledBitmapAndAddChild = function (bitmapSrc, normalizedPosition, stage) {
    var newBitmap = that.createScaledBitmap(bitmapSrc, normalizedPosition);
    stage.addChild(newBitmap);

    return newBitmap;
  };

  that.drawRect = function (normalizedRect, color, stage) {
    var shape = new createjs.Shape(),
      x = normalizedRect.x * scaledViewPortSize.x,
      y = normalizedRect.y * scaledViewPortSize.y,
      width = normalizedRect.w * scaledViewPortSize.x,
      height = normalizedRect.h * scaledViewPortSize.y;
    shape.graphics.beginFill(color).drawRect(x, y, width, height);
    stage.addChild(shape);
    return shape;
  };

  that.drawDebugRect = function (normalizedRect, stage) {
    that.drawRect (normalizedRect, "#ff0000", stage);
  };

  var isBetween = function (num, scaledMaxNum, low, high) {
    var normalizedNum = num / scaledMaxNum;
    return normalizedNum >= low && normalizedNum <= high;
  };

  that.isWithinScaledRect = function (clickPos, rect) {
    return isBetween(clickPos.x, scaledViewPortSize.x, rect.x, rect.x + rect.w)
        && isBetween(clickPos.y, scaledViewPortSize.y, rect.y, rect.y + rect.h);
  };

  that.getScaledPos = function (x, y) {
    return {
      x: x * scaledViewPortSize.x,
      y: y * scaledViewPortSize.y
    };
  };

  return that;
});
