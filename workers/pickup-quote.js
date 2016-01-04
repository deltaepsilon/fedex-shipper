var Firebase = require('firebase'),
  Queue = require('firebase-queue'),
  UtilityService = require('../services/utility'),
  easypost = require('node-easypost')(process.env.FEDEX_EASYPOST_API_KEY);

module.exports = function (queuesRef, options) {
  var ref = queuesRef.parent();

  new Queue(queuesRef.child('pickupQuote'), options, function (data, progress, resolve, reject) {
    var created = data.created,
      shipmentId = data.shipmentId,
      address = data.address,
      minDatetime = data.minDatetime,
      maxDatetime = data.maxDatetime,
      instructions = data.instructions,
      taskRef = queuesRef.child('pickupQuote').child('tasks').child(data.id),
      timer = setTimeout(function () {
        resolve();
      }, 1000 * 30);

    progress(10);
    new Promise(function (resolve, reject) {
        progress(20);
        easypost.Pickup.create({
          min_datetime: minDatetime,
          max_datetime: maxDatetime,
          shipment: {
            id: shipmentId
          },
          address: address,
          instructions: instructions
        }, function (err, quote) {
          err ? reject(err.message.message) : resolve(quote);
        });
      })
      .then(function (quote) {
        progress(40);
        taskRef.update({
          quote: UtilityService.firebaseSafe(quote)
        }, function (err) {
          clearTimeout(timer);
          err ? reject(err) : resolve();
        });
      }, reject);

  });
};