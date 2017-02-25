var mainWindow = null;
chrome.app.runtime.onLaunched.addListener(function(launchData) {
    if(mainWindow){
      mainWindow.contentWindow.launchData = launchData;
      mainWindow.focus();
      mainWindow.drawAttention();
      chrome.runtime.sendMessage({open: true});
    }
      chrome.app.window.create(
        'index.html', {
            id: 'Quantum',
            width: 900,
            height: 600,
            minWidth: 800,
            minHeight: 600,
            frame: 'none'
        }, function(win){
          mainWindow = win;
          win.contentWindow.launchData = launchData;
      });
});