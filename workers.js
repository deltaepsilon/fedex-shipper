var env = require('./app/env.js').env,
  secret = process.env.FEDEX_FIREBASE_SECRET,
  Firebase = require('firebase'),
  ref = new Firebase(env.firebase.location + '/queues'),
  fs = require('fs');

ref.authWithCustomToken(secret, function (error, authData) {
  if (error) {
    console.error('Firebase auth error:', error);
  } else {
    registerWorkers(ref);
  }
});

var registerWorkers = function (ref) {
  var files = fs.readdirSync('./workers')

  files.forEach(function (file) {
    var worker = require('./workers/' + file);
    worker(ref);
    
  });

};