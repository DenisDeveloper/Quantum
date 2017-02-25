(function($) {
  $.fn.initializeWindowBar = function(color) {
    var windowBarWrapper = this;
    var windowBarWrapperColor = color;
    var windowBarAppendHTML = '<div class="app-windowbar"><div class="app-window-bar-icon app-windowbar-close"><div class="app-windowbar-line close-left"></div><div class="app-windowbar-line close-right"></div></div><div class="app-window-bar-icon app-windowbar-maximize"><div class="app-windowbar-line maximize-left"></div><div class="app-windowbar-line maximize-right"></div><div class="app-windowbar-line maximize-top"></div><div class="app-windowbar-line maximize-bottom"></div></div><div class="app-window-bar-icon app-windowbar-minimize"><div class="app-windowbar-line minimize-mid"></div></div></div>';

    //css
    //check if color is a string
    if (typeof color === 'string' && color.length == 7 && color.indexOf('#') > -1) {
      windowBarWrapperColor = color;
    } else {
      windowBarWrapperColor = '#FFFFFF';
    }
    //window bar wrapper
    windowBarWrapper.css({
      'width': '100%',
      'height': '30px',
      'top': '0',
      'left': '0',
      'position': 'fixed',
      '-webkit-app-region': 'drag',
      'background-color': windowBarWrapperColor,
      'z-index': '9999'
    });

    //set line color according to background color
    function setTextColor(appWindowColor) {
      var nThreshold = 105;
      var components = getRGBComponents(appWindowColor);
      var bgDelta = (components.R * 0.299) + (components.G * 0.587) + (components.B * 0.114);

      return ((255 - bgDelta) < nThreshold) ? "#000000" : "#ffffff";
    }

    function getRGBComponents(color) {
      var r = color.substring(1, 3);
      var g = color.substring(3, 5);
      var b = color.substring(5, 7);
      return {
        R: parseInt(r, 16),
        G: parseInt(g, 16),
        B: parseInt(b, 16)
      };
    }
    //append elements
    windowBarWrapper.append(windowBarAppendHTML).find('.app-window-bar-icon div').css('background-color', setTextColor(windowBarWrapperColor));

  };
})(jQuery);
