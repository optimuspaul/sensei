/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const functions = require('firebase-functions'),
      admin = require('firebase-admin'),
      logging = require('@google-cloud/logging')(),
      https = require('https'),
      crypto = require('crypto');

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();


// To keep on top of errors, we should raise a verbose error report with Stackdriver rather
// than simply relying on console.error. This will calculate users affected + send you email
// alerts, if you've opted into receiving them.
// [START reporterror]
function reportError(err, context = {}) {
  // This is the name of the StackDriver log stream that will receive the log
  // entry. This name can be any valid log stream name, but must contain "err"
  // in order for the error to be picked up by StackDriver Error Reporting.
  const logName = 'errors';
  const log = logging.log(logName);

  // https://cloud.google.com/logging/docs/api/ref_v2beta1/rest/v2beta1/MonitoredResource
  const metadata = {
    resource: {
      type: 'cloud_function',
      labels: { function_name: process.env.FUNCTION_NAME }
    }
  };

  // https://cloud.google.com/error-reporting/reference/rest/v1beta1/ErrorEvent
  const errorEvent = {
    message: err.stack,
    serviceContext: {
      service: process.env.FUNCTION_NAME,
      resourceType: 'cloud_function'
    },
    context: context
  };

  // Write the error log entry
  return new Promise((resolve, reject) => {
    log.write(log.entry(metadata, errorEvent), error => {
      if (error) { reject(error); }
      resolve();
    });
  });
}
// [END reporterror]

// Sanitize the error message for the user
function userFacingMessage(error) {
  return error.type ? error.message : 'An error occurred, developers have been alerted';
}


exports.locations = functions.https.onRequest((request, res) => {
  db.collection(`classrooms`)
    .doc(`${request.body.classroom_id}`)
    .collection(`locationReports`)
    .add({ 
      timestamp: new Date(request.body.timestamp),
      sensors: request.body.sensors
    })
    .then((docRef) => {
      res.status(200).send(`Document written with ID: ${docRef.id}`);
    })
    .catch((error) => {
      reportError(error, {event})
    });
});

exports.radioObservations = functions.https.onRequest((request, res) => {

  let batch = db.batch();
  let obs = request.body.obs;
  let classroomId = request.body.classroom_id;

  obs.forEach((ob) => {
    let observedAt = new Date(ob.observed_at);
    let obRef = db.collection(`classrooms`)
      .doc(`${classroomId}`)
      .collection(`radioObservations`)
      .doc(`${observedAt.getMonth()+1}-${observedAt.getDate()}-${observedAt.getFullYear()}`)
      .collection(`events`)
      .doc(ob.observed_at)
    batch.set(obRef, ob)
  })

  batch.commit()
    .then((docRef) => {
      res.status(200).send(`Observations committed`);
    })
    .catch((error) => {
      reportError(error, {obs, classroomId})
    });

});