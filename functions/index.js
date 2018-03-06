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
      _ = require('lodash'),
      crypto = require('crypto');

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();
const INFLECTION_POINT = 6;


exports.generateInteractionPeriods = functions.firestore.document('/classrooms/{classroomId}/entity_locations/{entityLocationId}').onCreate(event => {

  // This onWrite will trigger whenever anything is written to the path, so
  // noop if the charge was deleted, errored out, or the Stripe API returned a result (id exists)
  if (!event.data.exists) return null;

  const currentLoc = event.data.data();
  const classroomId = event.params.classroomId;
  const entityLocationId = event.params.entityLocationId;
  const currentEntityUid = `${currentLoc.entityType}-${currentLoc.entityId}`;
  const date = currentLoc.timestamp;
  const dateKey = `${date.getMonth()}-${date.getDate()}-${date.getYear()}`;

  let startDate = new Date(date);
  startDate.setHours(0);
  startDate.setMinutes(0);

  return db.doc(`/classrooms/${classroomId}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        let data = doc.data();
        if (!data.interactions || !data.interactions.updatedAt || (currentLoc.timestamp - data.interactions.updatedAt) > (1000*60) ) {
          console.log("updating", "\n\ncurrentEntityUid: ", currentEntityUid, "\n\nentityLocationId", entityLocationId, "\n\ndate: ", date, "\n\ndateKey: ", dateKey, "\n\nclassroomId: ", classroomId, "\n\ncurrentLoc: ", currentLoc)
          return Promise.resolve(doc)
        }
      }
    })
    .then((classroom) => {
      let data = classroom.data();
      console.log("setting updatedAt for classroom interactions object", data)
      return classroom.ref.set({
        interactions: {
          updatedAt: currentLoc.timestamp
        }
      }, {
        merge: true
      })
      .then(() => {
        console.log("getting latest entity_locations to process")
        return db.collection(`/classrooms/${classroomId}/entity_locations`)
        .where("timestamp", ">=", data.interactions.updatedAt)
        .where("timestamp", "<", currentLoc.timestamp)
        .orderBy("timestamp", "asc")
        .get()
      })
      .then((querySnapshot) => {
        let entities;
        console.log("grouping locations by timestamp")
        let locationsByTimestamp = groupLocationsByTimestamp(querySnapshot.docs)
        console.log("locationsByTimestamp:", locationsByTimestamp)
        try {
          console.log("Updating entities", data.interactions.entities);
          entities = updateEntities(locationsByTimestamp, data.interactions.entities)
          console.log("entites:", entities);
        } catch (e) {
          console.log("error updating entities:", e);
        }
        let batch;
        try {
          console.log("batching writes")
          batch = db.batch();
          _.each(entities, (entity, entityUid) => {
            _.each(entity.interactionPeriods, (ip) => {
              let ipRef = db.doc(`/classrooms/${classroomId}/interaction_periods/${entityUid}-${ip.startTime.toISOString()}`);
              batch.set(ipRef, ip);
              _.set(entities, `${entityUid}.interactionPeriods`, []);
            });
          });
        } catch(e) {
          console.log("error batching writes!", e);
        }
        console.log("committing batch writes");
        try {
          return batch.commit()
            .then(() => {
              console.log("updating classroom interactions object", classroom.id, classroom.data(), entities, new Date(_.last(_.keys(locationsByTimestamp))))
              return classroom.ref.set({
                interactions: {
                  updatedAt: new Date(_.last(_.keys(locationsByTimestamp))),
                  entities
                }
              }, {merge: true});
            })
            .catch((error) => {
              console.log("error committing batch writes and updating classroom", error);
            })
        } catch(e) {
          console.log("error committing batch writes", e);
        }
      });
    })
    .catch(error => {
      console.log("ERROR", error);
      reportError(error, {params: event.params});
    });
});


function groupLocationsByTimestamp(locationDocs) {
  return _.reduce(locationDocs, (current, doc) => {
    let data = doc.data();
    current[data.timestamp.toISOString()] = current[data.timestamp.toISOString()] || [];
    data.entityUid = `${data.entityType}-${data.entityId}`;
    current[data.timestamp.toISOString()].push(data);
    return current;
  }, {});
}

function updateEntities(locationsByTimestamp, entities = {}) {
  return _.reduce(locationsByTimestamp, (current, locations, timestamp) => {
    timestamp = new Date(timestamp);
    _.each(locations, (location) => {
      _.each(locations, (loc) => {
        if (loc.entityUid === location.entityUid) return;
        let currentPeriod = _.get(current, `${location.entityUid}.${loc.entityUid}.currentPeriod`);
        let prevIpq = _.get(current, `${location.entityUid}.${loc.entityUid}.ipq`, 0);
        let ipq = calcIpq(prevIpq, location, loc, currentPeriod, timestamp);
        _.set(current, `${location.entityUid}.${loc.entityUid}.ipq`, ipq);
        
        if (prevIpq >= INFLECTION_POINT && ipq < INFLECTION_POINT) {
          let locationPeriods = _.get(current, `${location.entityUid}.interactionPeriods`, [])
          currentPeriod.endTime = new Date(timestamp);
          locationPeriods.push(currentPeriod);
          _.set(current, `${location.entityUid}.interactionPeriods`, locationPeriods);
          _.set(current, `${location.entityUid}.${loc.entityUid}.currentPeriod`, {});
        } else if (ipq >= INFLECTION_POINT && prevIpq < INFLECTION_POINT) {
          _.set(current, `${location.entityUid}.${loc.entityUid}.currentPeriod`, {
            startTime: location.timestamp, 
            targetEntityId: loc.entityId, 
            targetEntityType: loc.entityType
          });
        }
        _.set(current, `${location.entityUid}.${loc.entityUid}.currentPeriod.endTime`, new Date(timestamp));
      });
    });
    return current;
  }, entities)
}

function calcIpq(prevIpq, loc1, loc2, currentPeriod = {}, currentTimestamp) {
  let mod = 0;
  if (_.isNaN(loc2.x) || _.isNaN(loc1.x)) {
    mod = -10;
  } else {
    let delta =  Math.hypot(loc2.x - loc1.x, loc2.y-loc1.y);
    delta = delta === 0 ? 0.001 : delta;
    mod = 1 + 1/(1/(1-(delta*3)));
    let latestTime = currentPeriod.endTime || currentPeriod.startTime;
    if (latestTime) {
      mod += (1-((currentTimestamp - latestTime)/10000));
    }
  }
  let ipq = prevIpq+mod;
  ipq = ipq - (5*(1/Math.pow(ipq-10,2)));
  ipq = ipq < 0 ? 0 : ipq;
  return ipq;
}



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