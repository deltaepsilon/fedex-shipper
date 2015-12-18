var Firebase = require('firebase'),
  Queue = require('firebase-queue'),
  UtilityService = require('../services/utility'),
  easypost = require('node-easypost')(process.env.FEDEX_EASYPOST_API_KEY);

module.exports = function (queuesRef) {
  var ref = queuesRef.parent(),
    options = {
      sanitize: false
    };

  new Queue(queuesRef.child('verifyParcel'), options, function (data, progress, resolve, reject) {
    var created = data.created,
      parcel = data.parcel,
      taskRef = queuesRef.child('verifyParcel').child('tasks').child(data.id),
      timer = setTimeout(function () {
        resolve();
      }, 1000 * 30);

    if (typeof parcel.predefined_package === 'boolean') {
      delete parcel.predefined_package;
    }

    progress(10);
    new Promise(function (resolve, reject) {
      progress(20);
      easypost.Parcel.create(parcel, function (err, verifiedParcel) {
        err ? reject(err.message.message) : resolve(verifiedParcel);
      });
    }).then(function (parcel) {
      progress(40);
      taskRef.update({
        verified: UtilityService.firebaseSafe(parcel)
      }, function (err) {
        clearTimeout(timer);
        err ? reject(err) : resolve();
      });
    }, reject);

  });
};