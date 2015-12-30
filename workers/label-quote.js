var env = require('../app/env.js').env,
  Firebase = require('firebase'),
  Queue = require('firebase-queue'),
  UtilityService = require('../services/utility'),
  easypost = require('node-easypost')(process.env.FEDEX_EASYPOST_API_KEY);

module.exports = function (queuesRef) {
  var ref = queuesRef.parent(),
    options = {
      sanitize: false
    };

  new Queue(queuesRef.child('labelQuote'), options, function (data, progress, resolve, reject) {
    var created = data.created,
      shipment = {
        to_address: env.destination,
        from_address: data.fromAddress,
        parcel: data.parcel
      },
      taskRef = queuesRef.child('labelQuote').child('tasks').child(data.id),
      timer = setTimeout(function () {
        resolve();
      }, 1000 * 30);

    progress(10);
    new Promise(function (resolve, reject) {
      progress(20);
      easypost.Shipment.create(shipment, function (err, newShipment) {
        err ? reject(err.message.message) : resolve(newShipment);
      });
    }).then(function (shipment) {
      progress(40);
      taskRef.update({
        shipment: UtilityService.firebaseSafe(shipment)
      }, function (err) {
        clearTimeout(timer);
        err ? reject(err) : resolve();
      });
    }, reject);

  });
};