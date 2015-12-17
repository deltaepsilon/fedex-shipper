var Firebase = require('firebase'),
  Queue = require('firebase-queue'),
  easypost = require('node-easypost')(process.env.FEDEX_EASYPOST_API_KEY);

module.exports = function (queuesRef) {
  var ref = queuesRef.parent(),
    options = {
      sanitize: false
    };

  new Queue(queuesRef.child('verifyAddress'), options, function (data, progress, resolve, reject) {
    var created = data.created,
      address = data.address,
      taskRef = queuesRef.child('verifyAddress').child('tasks').child(data.id),
      timer = setTimeout(function () {
        resolve();
      }, 1000 * 30);

    progress(10);
    new Promise(function (resolve, reject) {
      progress(20);
      easypost.Address.create(address, function (err, fromAddress) {
        err ? reject(err) : resolve(fromAddress);
      });
    }).then(function (fromAddress) {
      progress(30);
      return new Promise(function (resolve, reject) {
        fromAddress.verify(function (err, response) {
          err ? reject(err.message.message) : resolve(response);
        });
      });
    }).then(function (response) {
      progress(40);
      taskRef.update({
        verified: response.address
      }, function (err) {
        clearTimeout(timer);
        err ? reject(err) : resolve();
      });
    }, reject);

  });
};