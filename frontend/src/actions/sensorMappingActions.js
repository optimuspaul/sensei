import _ from 'lodash';
import {getSenseiToken, getClassroomId} from './../constants';
import Case from 'case';

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

export const commitMappings = (mappings) => {
  return (dispatch, getState) => {
    let mappings = getBulkMappings(getState().sensorMappings)
    debugger
    fetch('http://0.0.0.0:5000/api/v1/sensor_mappings', {
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
    })
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
    fetch(`http://0.0.0.0:5000/api/v1/sensor_mappings?classroom_id=${getClassroomId()}`, {
      headers: {
        'X-SenseiToken': getSenseiToken(),
        'Content-Type': 'application/json'
      },
    }).then(function(response) {
      return response.text()
    }).then((body) => {
      let mappings = JSON.parse(body);
      dispatch(addMappings(changeCase(mappings)));
    })
  }
}


function getBulkMappings(sensorMappings) {
  return _.reduce(sensorMappings, (current, grouping) => {
    if (_.isObject(grouping)) {
      current = _.concat(current, _.map(changeCase(grouping, 'snake'), (mapping) => {
        return _.merge(mapping, {classroom_id: getClassroomId()});
      }));
    }
    return current;
  }, [])
}

function changeCase(data, toCase = 'camel') {
  return _.map(data, (x) => {
    return _.reduce(x, (current, val, key) => {
      current[Case[toCase](key)] = val;
      return current;
    }, {});
  });
}
