import _ from 'lodash';
import {getSenseiToken, getClassroomId, baseUrl, entityInflections} from './../constants';
import {handleRequest} from './requestActions';
import {changeCase, parsePhotoSegmentTimestamp} from './../utils';
import moment from 'moment';
import firebase from './../firebase';


export const authenticate = (username, password) => {
  let credentials = btoa(`${username}:${password}`);
  
  return (dispatch, getState) => {
    dispatch({
      type: 'AUTHENTICATE',
      credentials 
    })
    dispatch(fetchPhotos())
    .then(() => {
      localStorage.setItem('TC_CAMERA_BUILDER_CREDS', credentials);
      return dispatch({
        type: 'AUTH_SUCCEEDED'
      })
    })
    .catch(() => {
      dispatch({
        type: 'AUTH_FAILED'
      })
    })
  }
}

export const deauthenticate = () => {
  localStorage.removeItem('TC_CAMERA_BUILDER_CREDS');
  return {
    type: 'DEAUTHENTICATE'
  }
}


let unsubscribers = {};
export const fetchPhotos = (location, camera, date, vantagePoint) => {
  return (dispatch, getState) => {
    let refPath;
    let state = getState();

    dispatch({
      type: 'FETCHING_PHOTOS'
    })

    if (location && camera && date && vantagePoint && !unsubscribers[refPath]) {

      if (unsubscribers[refPath]) {
        return dispatch(receivePhotos({}, location, camera, date, vantagePoint));
      }

      refPath = `${location}/${camera}/${date}/${vantagePoint}`;
      unsubscribers[refPath] = firebase.firestore().collection(`/camera_data/${refPath}`)
        .orderBy('LastModified', 'asc')
        .onSnapshot(function(snapshot) {
          let docs = _.filter(snapshot.docChanges, {type: "added"});
          let photos = _.reduce(snapshot.docs, (current, doc) => {
            let data = doc.data();
            current[doc.id] = data;
            current[doc.id].timestamp = parsePhotoSegmentTimestamp(data.Key);
            return current;
          }, {});
          if (!_.isEmpty(photos)) {
            dispatch(receivePhotos(photos, location, camera, date, vantagePoint));
          }
        });
    }

    return fetch(`${baseUrl()}/api/v1/camera_data?${location ? `s3_folder_name=${location}` : ''}${date ? `&date=${date}` : ''}${camera ? `&mode=${camera}` : ''}`, {
      headers: getHeaders(getState())
    })
    .then(function(response) {
      return response.text()
    }).then((body) => {
      let cameraData = JSON.parse(body);
      dispatch({
        type: 'RECEIVED_PHOTOS',
        cameraData,
        location,
        date,
        camera,
        vantagePoint
      });
    })
  }
}


export const RECEIVE_PHOTOS = 'RECEIVE_PHOTOS';
export const receivePhotos = (photos, location, camera, date, vantagePoint) => {
  return {
    type: RECEIVE_PHOTOS,
    photos,
    location,
    camera,
    date,
    vantagePoint
  }
}



export const RECEIVE_CAMERA_SEGMENTS = 'RECEIVE_CAMERA_SEGMENTS';
export const receiveCameraSegments = (cameraSegments) => {
  return {
    type: RECEIVE_CAMERA_SEGMENTS,
    cameraSegments
  }
}

export const fetchCameraSegments = (location, date) => {
  return (dispatch, getState) => {
    let state = getState();
    date = date || _.get(state, 'cameraSegments.currentDate');
    date = date ? new Date(date) : new Date();
    date.setHours(date.getHours() - (date.getTimezoneOffset()/60));
    date.setMinutes(0);
    date.setSeconds(0);

    let endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 2);
    endDate.setHours(0);
    endDate.setMinutes(0);
    endDate.setSeconds(0);
    let startTime = encodeURIComponent(date.toISOString().split('.000Z')[0]);
    let endTime = encodeURIComponent(endDate.toISOString().split('.000Z')[0]);

    

    fetch(`${baseUrl()}/api/v1/camera_data/segments?s3_folder_name=${location}&start_time=${startTime}&end_time=${endTime}`, {
      headers: getHeaders(getState())
    })
    .then(function(response) {
      return response.text()
    }).then((body) => {
      let cameraSegments = JSON.parse(body);
      cameraSegments = _.map(cameraSegments, (segment) => {
        segment = changeCase(segment, 'camel');
        segment.startTime = new Date(segment.startTime);
        segment.endTime = new Date(segment.endTime);
        return segment
      })
      dispatch(receiveCameraSegments(cameraSegments));
    })
  }
}



const TOGGLE_LIVE_MODE = 'TOGGLE_LIVE_MODE';
export const toggleLiveMode = () => {
  return {
    type: TOGGLE_LIVE_MODE
  }
}

const HANDLE_SAVE_CAMERA_SEGMENT_SUCCESS = 'HANDLE_SAVE_CAMERA_SEGMENT_SUCCESS';
export const handleSaveCameraSegmentSuccess = (cameraSegment) => {
  return {
    type: HANDLE_SAVE_CAMERA_SEGMENT_SUCCESS,
    cameraSegment
  }
}

export const saveCameraSegment = (cameraSegment, requestId) => {
  let cameraSegmentToSave = {
    ...cameraSegment,
    startTime: cameraSegment.startTime.toISOString(),
    endTime: cameraSegment.endTime.toISOString()
  };
  return (dispatch, getState) => {
    dispatch(handleRequest(requestId, 'pending', cameraSegment));
    fetch(`${baseUrl()}/api/v1/camera_data/segments`, {
      headers: getHeaders(getState()),
      method: 'POST',
      body: JSON.stringify(changeCase(cameraSegmentToSave, 'snake'))
    }).then(function(response) {
      return response.text()
    }).then((body) => {
      cameraSegment.requestId = requestId;
      dispatch(handleSaveCameraSegmentSuccess(cameraSegment));
      dispatch(handleRequest(requestId, 'success', cameraSegment));
    }).catch((error) => {
      dispatch(handleRequest(requestId, 'error', {message: 'Something went wrong.'}));
    });
  }
}


let unsubscribeFromSNS, prevKeys;
export const SUBSCRIBE_TO_CAMERA_DATA_SNS = 'SUBSCRIBE_TO_CAMERA_DATA_SNS'
export const subscribeToCameraDataSNS = () => {
  return (dispatch, getState) => {
    let state = getState();
    prevKeys = [];
    unsubscribeFromSNS && unsubscribeFromSNS();
    let classroomIam = _.get(state, 'cameraSegmentBuilder.currentLocation');
    unsubscribeFromSNS = firebase.
      firestore()
      .doc(`camera_data_sns/${classroomIam}`)
      .onSnapshot((doc) => {
        if (doc.exists) {
          let data = doc.data()
          let key = data.cameraDataSNS.key;
          if (!_.includes(prevKeys, key) && !_.includes(key, 'json')) {
            dispatch(receiveCameraDataSNS(key));
            prevKeys.push(key);
          }
        }
      });
  }
}

export const RECEIVE_CAMERA_DATA_SNS = 'RECEIVE_CAMERA_DATA_SNS';
export const receiveCameraDataSNS = (key) => {
  return (dispatch, getState) => {
    let state = getState();
    dispatch({
      type: RECEIVE_CAMERA_DATA_SNS,
      key
    });
  }
}


function getHeaders(state) {
  let creds = _.get(state, 'cameraSegmentBuilder.credentials');
  return {
    'Authorization': `Basic ${creds}`,
    'Content-Type': 'application/json'
  }
}
