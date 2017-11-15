import _ from 'lodash';
import {getSenseiToken, getClassroomId, baseUrl, entityInflections} from './../constants';

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
      observations = _.reduce(observations.obs, (current, obs, index) => {
        if (_.sum(_.map(obs, _.sum)) !== 0) {
          current.obs.push(observations.obs[index]);
          current.entities.push(observations.entities[index]);
        }
        return current;
      }, {obs: [], entities: [], timestamps: observations.timestamps});
      dispatch(addObservations(entityId, entityType, observations));
    })
  }
}

export const fetchInteractionPeriods = (entityId, entityType, date) => {
  return (dispatch, getState) => {
    let state = getState();
    date = date || _.get(state, 'insights.ui.currentDate');
    date = date ? new Date(date) : new Date();

    let endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    let startTime = encodeURIComponent(date.toISOString().split('.000Z')[0]);
    let endTime = encodeURIComponent(endDate.toISOString().split('.000Z')[0]);


    fetch(`${baseUrl()}/api/v1/interaction_periods?classroom_id=${getClassroomId()}&entity_id=${entityId}&entity_type=${entityType}&start_time=${startTime}&end_time=${endTime}`, {
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

export const fetchInteractionTotals = (entityId, entityType, date, endDate, interactionType) => {
  return (dispatch, getState) => {
    let state = getState();
    date = date || _.get(state, 'insights.ui.currentDate');
    date = date ? new Date(date) : new Date();

    let endDate = endDate || _.get(state, 'insights.ui.endDate');
    endDate = endDate ? new Date(endDate) : new Date();


    let startTime = encodeURIComponent(date.toISOString().split('.000Z')[0]);
    let endTime = encodeURIComponent(endDate.toISOString().split('.000Z')[0]);
    let it = _.invert(entityInflections)[interactionType];

    fetch(`${baseUrl()}/api/v1/interaction_totals?classroom_id=${getClassroomId()}${entityId && interactionType !== 'socialGraph' ? `&entity_id=${entityId}` : ''}${entityType ? `&entity_type=${entityType}` : ''}&start_time=${startTime}&end_time=${endTime}${it ? `&interaction_type=${it}` : ''}`, {
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

export const SELECT_VISUALIZATION = 'SELECT_VISUALIZATION'
export const selectVisualization = (visualization) => {
  return (dispatch, getState) => {
    dispatch({
      type: SELECT_VISUALIZATION,
      visualization
    });
  }
}

export const SELECT_INTERACTION_TYPE = 'SELECT_INTERACTION_TYPE'
export const selectInteractionType = (interactionType) => {
  return (dispatch, getState) => {
    dispatch({
      type: SELECT_INTERACTION_TYPE,
      interactionType
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

export const SELECT_END_DATE = 'SELECT_END_DATE'
export const selectEndDate = (endDate) => {
  return (dispatch, getState) => {
    dispatch({
      type: SELECT_END_DATE,
      endDate
    });
  }
}

export const ADD_DAY = 'ADD_DAY'
export const addDay = (date) => {
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  return (dispatch, getState) => {
    dispatch({
      type: ADD_DAY,
      date
    });
  }
}

export const REMOVE_DAY = 'REMOVE_DAY'
export const removeDay = (date) => {
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  return (dispatch, getState) => {
    dispatch({
      type: REMOVE_DAY,
      date
    });
  }
}

export const REFRESH_FROM_PARAMS = 'REFRESH_FROM_PARAMS'
export const refreshFromParams = (params) => {
  return (dispatch, getState) => {
    dispatch({
      type: REFRESH_FROM_PARAMS,
      params
    });
  }
}

export const SET_ZOOM = 'SET_ZOOM'
export const setZoom = (zoom) => {
  return (dispatch, getState) => {
    dispatch({
      type: SET_ZOOM,
      zoom
    });
  }
}


