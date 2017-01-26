import _ from 'lodash';
import {getSenseiToken, getClassroomId, baseUrl} from './../constants';

import {handleRequest} from './requestActions';

const ADD_OBSERVATIONS = 'ADD_OBSERVATIONS';
export const addObservations = (childId, observations) => {
  return {
    type: ADD_OBSERVATIONS,
    observations,
    childId
  }
}

export const fetchObservations = (childId) => {
  return (dispatch) => {
    let startTime = encodeURIComponent("2017-01-24T00:00:00");
    let endTime = encodeURIComponent("2017-01-25T23:59:59");

    fetch(`${baseUrl()}/api/v1/radio_observations?classroom_id=${getClassroomId()}&child_id=${childId}&start_time=${startTime}&end_time=${endTime}`, {
      headers: {
        'X-SenseiToken': getSenseiToken(),
        'Content-Type': 'application/json'
      }
    }).then(function(response) {
      return response.text()
    }).then((body) => {
      let observations = JSON.parse(body);
      dispatch(addObservations(childId, observations));
    })
  }
}






