var Firebase = require('firebase'),
  Queue = require('firebase-queue'),
  UtilityService = require('../services/utility'),
  easypost = require('node-easypost')(process.env.FEDEX_EASYPOST_API_KEY);

module.exports = function (queuesRef) {
  var ref = queuesRef.parent(),
    options = {
      sanitize: false
    };

  new Queue(queuesRef.child('pickupPurchase'), options, function (data, progress, resolve, reject) {
    var created = data.created,
      pickupId = data.pickupId,
      pickupRateId = data.pickupRateId,
      shipmentId = data.shipmentId,
      taskRef = queuesRef.child('pickupPurchase').child('tasks').child(data.id),
      timer = setTimeout(function () {
        resolve();
      }, 1000 * 30);

    progress(10);
    new Promise(function (resolve, reject) {
        progress(20);
        easypost.Pickup.retrieve(pickupId, function (err, pickup) {
          err ? reject(err.message.message) : resolve(pickup);
        });
      })
      .then(function (pickup) {
        progress(30);
        if (pickup.status === 'scheduled') {
          return Promise.resolve(pickup);
        } else {
          return new Promise(function (resolve, reject) {
            pickup.buy({
              rate: {
                id: pickupRateId
              }
            }, function (err, purchased) {
              err ? reject(err.message ? err.message.message : err.toString()) : resolve(purchased)
            });
          });
        }

      })
      .then(function (purchased) {
        progress(40);
        taskRef.update({
          pickup: UtilityService.firebaseSafe(purchased)
        }, function (err) {
          clearTimeout(timer);
          err ? reject(err) : resolve();
        });
      }, reject);

  });
};