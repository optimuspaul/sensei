import _ from 'lodash';
import moment from 'moment';
import {getSenseiToken, getClassroomId, baseUrl, entityInflections} from './../constants';
import firebase from './../firebase';

export const ADD_OBSERVATIONS = 'ADD_OBSERVATIONS';
export const addObservations = (entityId, entityType, observations) => {
  return (dispatch, getState) => {
    let state = getState();
    let entity = _.get(state, `entities.${entityInflections[entityType]}.${entityId}`);
    dispatch({
      type: ADD_OBSERVATIONS,
      observations,
      entityId,
      entityType,
      entity,
      ui: {}
    });
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
      return (response && response.text()) || ''
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
    date.setHours(0);

    

    let endDate = _.get(state, 'insights.ui.endDate');
    endDate = endDate || _.get(state, 'insights.ui.endDate');
    endDate = endDate ? new Date(endDate) : new Date();
    endDate.setHours(23);
    let startTime = encodeURIComponent(date.toISOString());
    let endTime = encodeURIComponent(endDate.toISOString());


    fetch(`${baseUrl()}/api/v1/interaction_periods?classroom_id=${getClassroomId()}&entity_id=${entityId}&entity_type=${entityType}&start_time=${startTime}&end_time=${endTime}`, {
      headers: {
        'X-SenseiToken': getSenseiToken(),
        'Content-Type': 'application/json'
      }
    }).then(function(response) {
      return (response && response.text()) || ''
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
      return (response && response.text()) || ''
    }).then((body) => {
      let observations = JSON.parse(body);
      dispatch(addObservations(entityId, entityType, observations));
    })
  }
}

export const SELECT_ENTITY = 'SELECT_ENTITY'
export const selectEntity = (entityId, entityType) => {
  return (dispatch, getState) => {
    let state = getState();
    let entity = _.get(state, `entities.${entityInflections[entityType]}.${entityId}`);
    dispatch({
      type: SELECT_ENTITY,
      entityId,
      entityType,
      entity
    });
    dispatch(updateCurrentVisualization());
  }
}



export const updateCurrentVisualization = () => {
  return (dispatch, getState) => {
    let {currentEntityId, currentEntityType, visualization, currentDate, endDate, interactionType} = getState().insights.ui;

    switch(visualization) {
      case 'locations':
        dispatch(fetchLocations());
        break;
      case 'activityTimeline':
        dispatch(fetchObservations(currentEntityId, currentEntityType, currentDate, interactionType));
        break;
      case 'segmentedTimeline':
        dispatch(fetchInteractionPeriods(currentEntityId, currentEntityType, currentDate));
        break;
      case 'socialGraph':
        dispatch(fetchInteractionTotals(currentEntityId, currentEntityType, currentDate, endDate, visualization));
        break;
      case 'unitSummary':
      case 'studentSummary':
      case 'interactionTotals':
        if (endDate && !(visualization === 'unitSummary' && !interactionType)) {
          dispatch(fetchInteractionTotals(currentEntityId, currentEntityType, currentDate, endDate, visualization === 'unitSummary' && interactionType));
        }
        break;
    }
  }
}


export const RECEIVE_LOCATIONS = 'RECEIVE_LOCATIONS';
export const receiveLocations = (locations, classroomHeight, classroomWidth) => {
  return (dispatch, getState) => {
    let state = getState();
    dispatch({
      type: RECEIVE_LOCATIONS,
      locations,
      classroomHeight,
      classroomWidth
    });
  }
}



let prevDate;
export const FETCH_LOCATIONS = 'FETCH_LOCATIONS'
export const fetchLocations = (date) => {
  return (dispatch, getState) => {
    let state = getState();
    date = date || _.get(state, 'insights.ui.currentDate');
    date = date ? new Date(date) : new Date();
    date.setHours(0);

    if (prevDate === date) {
      return;
    } else {
      prevDate = date;
    }

    let endDate = _.get(state, 'insights.ui.endDate');
    endDate = endDate || _.get(state, 'insights.ui.endDate');
    endDate = endDate ? new Date(endDate) : new Date();
    endDate.setHours(23);

    firebase.firestore()
      .doc(`/classrooms/${getClassroomId()}`)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return Promise.reject()
        }
        let classroom = doc.data();
        return doc.ref.collection(`locationReports`)
          .where('timestamp', '>', date)
          .where('timestamp', '<', endDate)
          .orderBy('timestamp', 'desc')
          .onSnapshot(function(snapshot) {
            _.each(snapshot.docChanges, (change, index) => {
              if (change.type === "added") {
                // setTimeout(() => { 
                  dispatch(receiveLocations(change.doc.data(), classroom.height, classroom.width))
                // }, index*5000);
              }
            });
          });
      })
  }
}

export const SHOW_LOCATIONS_AT = 'SHOW_LOCATIONS_AT'
export const showLocationsAt = (date) => {
  return (dispatch, getState) => {
    date = new Date(date);
    let state = getState();
    let obs = _.get(state, `insights.currentObservationsData.obs`);
    let zoom = _.findIndex(obs, (ob) => {
      return ob.timestamp > date; 
    });
    zoom = zoom < 0 ? 0 : zoom+1;

    dispatch({
      type: SET_ZOOM,
      zoom
    });
    
  }
}

export const SELECT_VISUALIZATION = 'SELECT_VISUALIZATION'
export const selectVisualization = (visualization) => {
  return (dispatch, getState) => {
    let state = getState();
    let entityId = _.get(state, 'insights.ui.currentEntityId');
    let entityType = _.get(state, 'insights.ui.currentEntityType');
    dispatch({
      type: SELECT_VISUALIZATION,
      visualization
    });
    dispatch(updateCurrentVisualization());

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
    dispatch(updateCurrentVisualization());
  }
}

export const SELECT_END_DATE = 'SELECT_END_DATE'
export const selectEndDate = (endDate) => {
  return (dispatch, getState) => {
    dispatch({
      type: SELECT_END_DATE,
      endDate
    });
    dispatch(updateCurrentVisualization());
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
      date: date
    });
    dispatch(updateCurrentVisualization());
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
    dispatch(updateCurrentVisualization());
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


