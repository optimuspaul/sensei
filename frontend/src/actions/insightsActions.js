import _ from 'lodash';
import {getSenseiToken, getClassroomId, baseUrl} from './../constants';

import {handleRequest} from './requestActions';

export const ADD_OBSERVATIONS = 'ADD_OBSERVATIONS';
export const addObservations = (childId, observations) => {
  return {
    type: ADD_OBSERVATIONS,
    observations,
    childId
  }
}

export const fetchObservations = (childId, date) => {
  return (dispatch, getState) => {
    let state = getState();
    date = date || _.get(state, 'insights.ui.currentDate');
    date = date ? new Date(date) : new Date();

    let endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    let startTime = encodeURIComponent(date.toISOString().split('.000Z')[0]);
    let endTime = encodeURIComponent(endDate.toISOString().split('.000Z')[0]);


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

export const SELECT_CHILD = 'SELECT_CHILD'
export const selectChild = (childId) => {
  return (dispatch, getState) => {
    dispatch({
      type: SELECT_CHILD,
      childId
    });
  }
}

export const SELECT_DATE = 'SELECT_DATE'
export const selectDate = (date) => {
  return (dispatch, getState) => {
    dispatch({
      type: SELECT_DATE,
      date
    });
  }
}




