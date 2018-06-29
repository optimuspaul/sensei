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


let unsubscribeFromCameraData;
export const fetchPhotos = (location, camera, date, vantagePoint) => {
  return (dispatch, getState) => {
    let state = getState();
    date = date ? date : _.get(state, 'cameraSegmentBuilder.currentDate');
    if (location && camera && date && vantagePoint) {

      updateParams(location, camera, date, vantagePoint)

      if (!unsubscribeFromCameraData || !_.isEqual(_.get(state, 'cameraSegmentBuilder.currentLocation'), location) || !_.isEqual(_.get(state, 'cameraSegmentBuilder.currentDate'), date)) {
        unsubscribeFromCameraData && unsubscribeFromCameraData();
        dispatch({
          type: 'FETCHING_PHOTOS'
        });
      } else {
        return dispatch(receivePhotos({}, location, camera, date, vantagePoint));
      }

      unsubscribeFromCameraData = firebase.firestore().collection(`/camera_data/${location}/${date}/`)
        .onSnapshot(function(snapshot) {
          let docs = _.map(_.filter(snapshot.docChanges), c => c.doc);
          let photos = _.reduce(docs, (current, doc) => {
            let data = doc.data();
            current[doc.id] = data;
            return current;
          }, {});
          if (!_.isEmpty(photos)) {
            dispatch(receivePhotos(photos, location, camera, date, vantagePoint));
          }
        });
    }

    dispatch(fetchCameraData(location, camera, date, vantagePoint));

    if (location && state.cameraSegmentBuilder.currentLocation === location) {
      return dispatch(updateParams(location, camera, date, vantagePoint));
    }

  }
}

export const fetchCameraData = (location, camera, date, vantagePoint) => {
  return (dispatch, getState) => {
    dispatch({
      type: 'FETCHING_CAMERA_DATA'
    })

    return fetch(`${baseUrl()}/api/v1/camera_data`, {
      headers: getHeaders(getState())
    })
    .then(function(response) {
      return response.text()
    }).then((body) => {
      let cameraData = JSON.parse(body);
      dispatch({
        type: 'RECEIVED_CAMERA_DATA',
        cameraData
      });
    })
  }
}

export const UPDATE_PARAMS = 'UPDATE_PARAMS';
export const updateParams = (location, camera, date, vantagePoint) => {
  return {
    type: UPDATE_PARAMS,
    location,
    camera,
    date,
    vantagePoint
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

const SET_INDEX = 'SET_INDEX';
export const setIndex = (index) => {
  return {
    type: SET_INDEX,
    index
  }
}

const TOGGLE_LIVE_MODE = 'TOGGLE_LIVE_MODE';
export const toggleLiveMode = (bool) => {
  return {
    type: TOGGLE_LIVE_MODE,
    bool
  }
}

const TOGGLE_SHOW_LOCATIONS = 'TOGGLE_SHOW_LOCATIONS';
export const toggleShowLocations = (bool) => {
  return {
    type: TOGGLE_SHOW_LOCATIONS,
    bool
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



function getHeaders(state) {
  let creds = _.get(state, 'cameraSegmentBuilder.credentials');
  return {
    'Authorization': `Basic ${creds}`,
    'Content-Type': 'application/json'
  }
}
