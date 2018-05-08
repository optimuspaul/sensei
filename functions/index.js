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
      crypto = require('crypto'),
      MessageValidator = require('sns-validator');
      

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();
const validator = new MessageValidator();


exports.flagForInteractionPeriodGeneration = functions.firestore.document('/classrooms/{classroomId}/entity_locations/{entityLocationId}').onCreate(event => {

  if (!event.data.exists) return null;

  const currentLoc = event.data.data();
  const date = currentLoc.timestamp;
  const classroomId = event.params.classroomId;
  const dateKey = `${date.getMonth()+1}-${date.getDate()}-${date.getFullYear()}`;

  return db.doc('constants/generateInteractionPeriods').get()
    .then((constantsDoc) => {
      let freq = 15;
      if (constantsDoc.exists) {
        freq = constantsDoc.data().ipCalcFreq;
      }
      if (date.getMinutes() % freq === 0 && date.getSeconds() < 10) {
        console.log("frequency requirement met, creating flag", currentLoc)
        return db.doc(`/classrooms/${classroomId}/ip_buffers/${dateKey}/flags/${date.getHours()}-${date.getMinutes()}`).set(currentLoc);
      }
    });
});

exports.generateInteractionPeriods = functions.firestore.document('/classrooms/{classroomId}/ip_buffers/{dateKey}/flags/{timeKey}').onCreate(event => {

  if (!event.data.exists) return null;

  const currentLoc = event.data.data();
  const classroomId = event.params.classroomId;
  const date = currentLoc.timestamp;
  const ipBufferRef = db.doc(`/classrooms/${classroomId}/ip_buffers/${date.getMonth()+1}-${date.getDate()}-${date.getFullYear()}`);

  let CONSTANTS = {
    ipInflectionPoint: 8,
    ipCalcFreq: 30,
    ipTimeDiffDenominator: 10000,
    ipDistanceDiffMultiplier: 3,
    ipMinRequiredInteractionTime: 1
  }
  
  console.log("generating interaction periods", currentLoc);
  return db.doc('constants/generateInteractionPeriods').get()
    .then((constantsDoc) => {
      if (constantsDoc.exists) {
        CONSTANTS = _.merge(CONSTANTS, constantsDoc.data());
      }
      return ipBufferRef.get()
    })
    .then((ipBufferDoc) => {
      let ipBuffer = ipBufferDoc.exists ? ipBufferDoc.data() : {updatedAt: date};
      return db.collection(`/classrooms/${classroomId}/entity_locations`)
        .where("timestamp", ">=", ipBuffer.updatedAt)
        .where("timestamp", "<", date)
        .orderBy("timestamp", "asc")
        .get()
        .then((querySnapshot) => {
          let locationsByTimestamp = groupLocationsByTimestamp(querySnapshot.docs)
          let entities = updateEntities(locationsByTimestamp, ipBuffer.entities)
          let batch;
          batch = db.batch();
          _.each(entities, (entity, entityUid) => {
            _.each(entity, (ip, otherEntityUid) => {
              if (ip.currentPeriod.startTime && ip.currentPeriod.endTime) {
                let ipRef = db.doc(`/classrooms/${classroomId}/interaction_periods/${entityUid}-${otherEntityUid}-${ip.currentPeriod.startTime.toISOString()}`);
                batch.set(ipRef, ip.currentPeriod);
              }
            });
          });
          return batch.commit()
            .then(() => {
              return ipBufferRef.set({
                updatedAt: date,
                entities
              }, {merge: true});
            })
        });
    })
    .catch(error => {
      console.log("ERROR", error);
      reportError(error, {params: event.params});
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
          let currentPeriod = _.get(current, `${location.entityUid}.${loc.entityUid}.currentPeriod`, {
              targetEntityId: loc.entityId, 
              targetEntityType: loc.entityType,
              sourceEntityId: location.entityId,
              sourceEntityType: location.entityType
          });
          let prevIpq = _.get(current, `${location.entityUid}.${loc.entityUid}.ipq`, 0);
          let ipq = calcIpq(prevIpq, location, loc, currentPeriod, timestamp);
          _.set(current, `${location.entityUid}.${loc.entityUid}.ipq`, ipq);
          if (prevIpq >= CONSTANTS.ipInflectionPoint && ipq < CONSTANTS.ipInflectionPoint) {
            delete currentPeriod.endTime;
            delete currentPeriod.startTime;
          }
          if (ipq >= CONSTANTS.ipInflectionPoint) {
            if (prevIpq < CONSTANTS.ipInflectionPoint) {
              currentPeriod.startTime = location.timestamp;
            }
          }
          if (currentPeriod.startTime && (timestamp - currentPeriod.startTime) > (1000*60*CONSTANTS.ipMinRequiredInteractionTime)) {
            currentPeriod.endTime = timestamp;
          }
          _.set(current, `${location.entityUid}.${loc.entityUid}.currentPeriod`, currentPeriod);

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
      mod = 1 + (1-(delta*CONSTANTS.ipDistanceDiffMultiplier));
      let latestTime = currentPeriod.endTime || currentPeriod.startTime;
      if (latestTime) {
        mod += (1-((currentTimestamp - latestTime)/CONSTANTS.ipTimeDiffDenominator));
      }
    }
    let ipq = prevIpq+mod;
    // ipq = ipq - (5*(1/Math.pow(ipq-10,2)));
    ipq = ipq < 0 ? 0 : ipq;
    return ipq;
  }


});







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

exports.clearEntityLocations = functions.https.onRequest((request, res) => {
  return clear(request, res, 'entity_locations', 'timestamp')
    .then((message) => {
      res.status(200).send(message);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

exports.clearIpBuffers = functions.https.onRequest((request, res) => {
  let date = new Date(request.query.from);
  return clear(request, res, `ip_buffers/${date.getMonth()+1}-${date.getDate()}-${date.getFullYear()}/flags`, 'timestamp')
    .then((msg) => {
      let message = msg;
      return db.doc(`/classrooms/${request.query.classroom_id}/ip_buffers/${date.getMonth()+1}-${date.getDate()}-${date.getFullYear()}`)
        .delete()
        .then(() => {
          res.status(200).send(message);
        })
        .catch((error) => {
          res.status(500).send('could not delete ip_buffer', error);
        })
    }).catch((error) => {
      res.status(500).send(error);
    })
});

exports.clearInteractionPeriods = functions.https.onRequest((request, res) => {
  return clear(request, res, 'interaction_periods', 'startTime')
    .then((message) => {
      res.status(200).send(message);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

function clear(request, res, collectionName, dateField) {
  if (request.method !== 'DELETE') return res.status(404);
  let from = new Date(request.query.from);
  let to = new Date(request.query.to);
  let classroomId = request.query.classroom_id;
  console.log('step 1')
  if (!_.isDate(from) || !_.isDate(to) || from > to || !classroomId) {
    return Promise.reject(`must include a valid 'from' date, a valid 'to' date that occurs later, and a 'classroom_id'. from: ${from},  to: ${to}, classroom_id: ${classroomId}`);
  }
  return validateFirebaseIdToken(request, res).then(() => {
    console.log('step 2')
    let batchSize = 200;
    let query = db.collection(`/classrooms/${classroomId}/${collectionName}`)
      .where(dateField, ">=", from)
      .where(dateField, "<", to)
      .orderBy(dateField, "asc")
      .limit(batchSize)
    
    let deletePromise =  new Promise((resolve, reject) => {
        deleteQueryBatch(query, batchSize, resolve, reject);
    });

    return deletePromise.then((docRef) => {
      console.log('step 3')
      Promise.resolve(`${collectionName} from ${from} to ${to} successfully deleted`);
    })
    .catch((error) => {
      console.log(`something went wrong`, error)
      Promise.reject(`something went wrong`, error);
    })
  }).catch((error) => {
    console.log(`something went wrong`, error)
    Promise.reject(`something went wrong`, error);
  });
}

function deleteQueryBatch(query, batchSize, resolve, reject) {
  return query.get().then((snapshot) => {
    console.log('step 5')
    // When there are no documents left, we are done
    console.log("snapshot.size: ", snapshot.size);
    if (snapshot.size == 0) {
      return 0;
    }

    // Delete documents in a batch
    var batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    return batch.commit().then(() => {
      return snapshot.size;
    });
  }).then((numDeleted) => {
    console.log("numDeleted: ", numDeleted);
    if (numDeleted === 0) {
      resolve();
      return;
    }

    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
      deleteQueryBatch(query, batchSize, resolve, reject);
    });
  })
  .catch((error) => {
    reportError(error, {query});
  });
};


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



exports.cameraDataSNS = functions.https.onRequest((req, res) => {

  const expectedTopicArn = 'arn:aws:sns:us-east-1:204031725010:classroom-data-upload';

  // we only respond to POST method HTTP requests
  if (req.method !== 'POST') {
    res.status(405).end('only post method accepted');
    return;
  }

  // all valid SNS requests should have this header
  var snsHeader = req.get('x-amz-sns-message-type');
  if (snsHeader === undefined) {
    res.status(403).end('invalid SNS message');
    return;
  }



  // use the sns-validator library to verify signature
  // we first parse the cloud function body into a javascript object
  validator.validate(JSON.parse(req.body), function (err, message) {
    if (err) {
      let messageBody = JSON.parse(req.body);
      if (messageBody.Records) {
        db.collection('/camera_data_sns')
          .add(messageBody)
          .then((docRef) => {
              console.log("Document written with ID: ", messageBody);
              res.status(200).end('ok');
          })
          .catch((error) => {
              console.error("Error adding document: ", error, messageBody);
              reportError("Error adding document: ", error, messageBody)
          });
        } else {
          console.error('invalid SNS Topic', err, message);
          res.status(403).end('invalid SNS Topic');
        }
      return;
    }
    if (message.TopicArn !== expectedTopicArn) {
      // we got a request from a topic we were not expecting to
      // this sample is set up to only receive from one specified SNS topic
      // one could adapt this to accept an array, but if you do not check
      // the origin of the message, anyone could end up publishing to your
      // cloud function
      res.status(403).end('invalid SNS Topic');
      return;
    }

    // here we handle either a request to confirm subscription, or a new
    // message
    switch (message.Type.toLowerCase()) {
      case 'subscriptionconfirmation':
        console.log('confirming subscription ' + message.SubscribeURL);
        // SNS subscriptions are confirmed by requesting the special URL sent
        // by the service as a confirmation
        https.get(message.SubscribeURL, (subRes) => {
          console.log('statusCode:', subRes.statusCode);
          console.log('headers:', subRes.headers);

          subRes.on('data', (d) => {
            console.log(d);
            res.status(200).end('ok');
          });
        }).on('error', (e) => {
          console.error(e);
          res.status(500).end('confirmation failed');
        });
        break;
      case 'notification':
        console.log(message.MessageId + ': ' + message.Message);
        break;
      default:
        console.error('should not have gotten to default block');
        res.status(400).end('invalid SNS message');
    }
  });

});

function validateFirebaseIdToken(req, res) {
  console.log('Check if request is authorized with Firebase ID token');

  if (!req.headers.authorization) {
    console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
        'Make sure you authorize your request by providing the following HTTP header:',
        'Authorization: Bearer <Firebase ID Token>.');
    res.status(403).send('Unauthorized');
    return Promise.reject();
  } else {
    
    return new Promise((resolve, reject) => {
      let options = {
        host: 'sensei-server.herokuapp.com',
        path: '/api/v1/fb_token',
        method: 'GET',
        headers: {
          Authorization: req.headers.authorization
        }
      };
      let content = '';
      let reqGet = https.request(options, (response) => {
        response.on('data', function (data) {
            content += data;
        });
        response.on('end', function () {
          console.log('content ', content)
          if (content === 'Unauthorized' || response.statusCode === 401) {
            console.error('Error while verifying Firebase ID token');
            res.status(403).send('Unauthorized');
            reject({stack: `Unathorized`});
          } else {
            resolve();
          }
        });
      });
      reqGet.end();
      reqGet.on('error', (err) => {
        console.error('Error while verifying Firebase ID token');
        res.status(403).send('Unauthorized');
        reject(err)
      });
        
    });
  }
};