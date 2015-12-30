var Firebase = require('firebase'),
  Queue = require('firebase-queue'),
  UtilityService = require('../services/utility'),
  easypost = require('node-easypost')(process.env.FEDEX_EASYPOST_API_KEY);

module.exports = function (queuesRef) {
  var ref = queuesRef.parent(),
    options = {
      sanitize: false
    };

  new Queue(queuesRef.child('pickupCancel'), options, function (data, progress, resolve, reject) {
    var created = data.created,
      pickupId = data.pickupId,
      shipmentId = data.shipmentId,
      spinnerId = data.spinnerId,
      taskRef = queuesRef.child('pickupCancel').child('tasks').child(data.id),
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
        if (pickup.status === 'canceled') {
          return Promise.resolve(pickup);
        } else {
          return new Promise(function (resolve, reject) {
            pickup.cancel(function (err, pickup) {
              err ? reject(err.message ? err.message.message : err.toString()) : resolve(pickup)
            });
          });
        }


      })
      .then(function (pickup) {
        progress(40);
        taskRef.update({
          cancelled: {
            spinnerId: spinnerId,
            shipmentId: shipmentId,
            pickup: UtilityService.firebaseSafe(pickup)
          }
        }, function (err) {
          clearTimeout(timer);
          err ? reject(err) : resolve();
        });
      }, reject);

  });
};