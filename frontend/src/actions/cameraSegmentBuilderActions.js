import _ from 'lodash';
import {getSenseiToken,  baseUrl} from './../constants';
import {handleRequest} from './requestActions';
import {changeCase} from './../utils';

export const fetchPhotos = (location, camera, date) => {
  return (dispatch, getState) => {

    fetch(`${baseUrl()}/api/v1/camera_data?${location ? `s3_folder_name=${location}` : ''}${date ? `&date=${date}` : ''}`, {
      headers: {
        'X-SenseiToken': getSenseiToken(),
        'Content-Type': 'application/json'
      }
    }).then(function(response) {
      return response.text()
    }).then((body) => {
      let cameraData = JSON.parse(body);
      dispatch({
        type: 'RECEIVED_PHOTOS',
        cameraData,
        location,
        date,
        camera
      });
    })
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
      headers: {
        'X-SenseiToken': getSenseiToken(),
        'Content-Type': 'application/json'
      }
    }).then(function(response) {
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
      headers: {
        // 'X-SenseiToken': getSenseiToken(),
        'Content-Type': 'application/json'
      },
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