import _ from 'lodash';
import {getSenseiToken, getClassroomId, baseUrl} from './../constants';
import {changeCases} from './../utils';
import {handleRequest} from './requestActions';

const ADD_MAPPINGS = 'ADD_MAPPINGS';
export const addMappings = (mappings) => {
  return {
    type: ADD_MAPPINGS,
    mappings
  }
}

const UPDATE_MAPPING = 'UPDATE_MAPPING';
export const updateMapping = (mapping) => {
  return {
    type: UPDATE_MAPPING,
    mapping
  }
}

const HANDLE_COMMIT_MAPPINGS_SUCCESS = 'HANDLE_COMMIT_MAPPINGS_SUCCESS';
export const handleCommitMappingsSuccess = (mapping) => {
  return {
    type: HANDLE_COMMIT_MAPPINGS_SUCCESS
  }
}

export const commitMappings = (requestId) => {
  return (dispatch, getState) => {
    let mappings = getBulkMappings(getState().sensorMappings)
    dispatch(handleRequest(requestId, 'pending', mappings));
    fetch(`${baseUrl()}/api/v1/sensor_mappings`, {
      headers: {
        'X-SenseiToken': getSenseiToken(),
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(mappings)
    }).then(function(response) {
      return response.text()
    }).then((body) => {
      dispatch(handleCommitMappingsSuccess());
      dispatch(handleRequest(requestId, 'success', body));
    }).catch((error) => {
      dispatch(handleRequest(requestId, 'error', {message: 'Something went wrong.'}));
    });
  }
}

export const saveMapping = (mapping) => {
  return (dispatch) => {
    return (new Promise((resolve, reject) => {
      resolve(mapping)
    })).then((mapping) => {
      dispatch(updateMapping(mapping))
    });
  }
}

export const fetchMappings = (schoolId, classroomId) => {
  return (dispatch) => {
    fetch(`${baseUrl()}/api/v1/sensor_mappings?classroom_id=${getClassroomId()}`, {
      headers: {
        'X-SenseiToken': getSenseiToken(),
        'Content-Type': 'application/json'
      },
    }).then(function(response) {
      return response.text()
    }).then((body) => {
      let mappings = JSON.parse(body);
      dispatch(addMappings(changeCases(mappings)));
    })
  }
}


function getBulkMappings(sensorMappings) {
  return _.reduce(sensorMappings, (current, grouping) => {
    if (_.isObject(grouping)) {
      current = _.concat(current, _.map(changeCases(grouping, 'snake'), (mapping) => {
        return _.merge(mapping, {classroom_id: getClassroomId()});
      }));
    }
    return current;
  }, [])
}


