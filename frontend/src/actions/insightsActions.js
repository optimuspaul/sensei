import _ from 'lodash';
import {getSenseiToken, getClassroomId, baseUrl} from './../constants';

export const ADD_OBSERVATIONS = 'ADD_OBSERVATIONS';
export const addObservations = (entityId, entityType, observations) => {
  return {
    type: ADD_OBSERVATIONS,
    observations,
    entityId,
    entityType
  }
}

export const fetchObservations = (entityId, entityType, date) => {
  return (dispatch, getState) => {
    let state = getState();
    date = date || _.get(state, 'insights.ui.currentDate');
    date = date ? new Date(date) : new Date();

    let endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    let startTime = encodeURIComponent(date.toISOString().split('.000Z')[0]);
    let endTime = encodeURIComponent(endDate.toISOString().split('.000Z')[0]);


    fetch(`${baseUrl()}/api/v1/radio_observations?classroom_id=${getClassroomId()}&entity_id=${entityId}&entity_type=${entityType}&start_time=${startTime}&end_time=${endTime}`, {
      headers: {
        'X-SenseiToken': getSenseiToken(),
        'Content-Type': 'application/json'
      }
    }).then(function(response) {
      return response.text()
    }).then((body) => {
      let observations = JSON.parse(body);
      dispatch(addObservations(entityId, entityType, observations));
    })
  }
}

export const SELECT_ENTITY = 'SELECT_ENTITY'
export const selectEntity = (entityId, entityType) => {
  return (dispatch, getState) => {
    dispatch({
      type: SELECT_ENTITY,
      entityId,
      entityType
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




