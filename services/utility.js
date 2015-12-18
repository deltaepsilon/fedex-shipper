module.exports = {
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
  }
};