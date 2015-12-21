var Firebase = require('firebase'),
  Queue = require('firebase-queue'),
  UtilityService = require('../services/utility'),
  easypost = require('node-easypost')(process.env.FEDEX_EASYPOST_API_KEY);

module.exports = function (queuesRef) {
  var ref = queuesRef.parent(),
    options = {
      sanitize: false
    };

  new Queue(queuesRef.child('purchaseLabel'), options, function (data, progress, resolve, reject) {
    var created = data.created,
      rateId = data.rateId,
      shipmentId = data.shipmentId,
      taskRef = queuesRef.child('purchaseLabel').child('tasks').child(data.id),
      timer = setTimeout(function () {
        resolve();
      }, 1000 * 30);

    progress(10);
    new Promise(function (resolve, reject) {
        progress(20);
        easypost.Shipment.retrieve(shipmentId, function (err, shipment) {
          err ? reject(err.message.message) : resolve(shipment);
        });
      }).then(function (shipment) {
        return new Promise(function (resolve, reject) {
          progress(30);
          shipment.buy({
            rate: {
              id: rateId
            }
          }, function (err, label) {
            err ? reject(err.message.message) : resolve(label);
          });
        });
      })
      .then(function (label) {
        progress(40);
        taskRef.update({
          label: UtilityService.firebaseSafe(label)
        }, function (err) {
          clearTimeout(timer);
          err ? reject(err) : resolve();
        });
      }, reject);

  });
};