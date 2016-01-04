var Firebase = require('firebase');
var env = require('../env.json').servers[process.env.NODE_ENV];
var secret = process.env.FEDEX_FIREBASE_SECRET;

module.exports = {
  env: env,
  firebaseSafe: function (incoming) {
    var result,
      clean = function (obj) {
        var keys = Object.keys(obj),
          i = keys.length;

        while (i--) {
          if (!obj[keys[i]] || typeof obj[keys[i]] === 'function' || (Array.isArray(obj[keys[i]]) && !obj[keys[i]].length)) {
            delete obj[keys[i]];
          } else if (typeof obj[keys[i]] === 'object') {
            clean(obj[keys[i]]);
          }
        }
        return obj;
      };

    return clean(incoming);
  },
  log: function (payload) {
    var logsRef = new Firebase(env.firebase.location + '/logs');
    logsRef.authWithCustomToken(secret, function (err, authData) {
      logsRef.push(payload);
    });
  }
};