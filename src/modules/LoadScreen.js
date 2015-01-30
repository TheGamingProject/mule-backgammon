/**
 * LoadScreen.js
 *  - is a easeljs Container
 *
 * Created by niko on 1/3/14. (ripped from rick & the ghost)
 */
define(["assets"], function (ourAssets) {

  var LoadScreen = function(args){
    var that = new createjs.Container();

    // Private Variables
    var totalResources,
      currentResourcesLoaded;

    var text;

    // Public Functions

    ////////  update load bar //////////
    that.progressByOneResource = function(resourceId){
      var gap = GAME.SIZE.y / totalResources;
      var rectangle = new createjs.Shape();

      rectangle.graphics.beginFill("green").drawRect(0, currentResourcesLoaded * gap, GAME.SIZE.x, gap);
      that.addChild(rectangle);

      currentResourcesLoaded++;

      //text.text = currentResourcesLoaded+"/"+totalResources+"   "+resourceId;
    };
    ////////////////////////////////////

    that.getLoadedCount = function(){
      return currentResourcesLoaded;
    };

    that.removeFromParent = function(){
      args.parentContainer.removeChild(that);
    };

    // Private Functions

    var init = function(){
      //make a new container (done during 'that' definition)
      // and add it to parent
      if (!args)
        throw "bad LoadScreen args";

      if (!args.totalResources)
        throw "no totalResources set";
      totalResources = args.totalResources;

      if (!args.parentContainer)
        throw "bad parent Container";
      args.parentContainer.addChild(that);

      //var font = ourAssets.fonts["someFont"];
      //text = new createjs.Text("", font.size+"px "+font.fontFamily, font.color);
      //text.x = 570;
      //text.y = 570;
      //that.addChild(text);

      currentResourcesLoaded = 0;
      console.log("loadScreen inited");
    };

    init();

    return that;
  };

  return LoadScreen;
});