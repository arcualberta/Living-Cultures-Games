chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('chrome-app.html', {
    'bounds': {
      'width': 1280,
      'height': 800
    }
  });
});