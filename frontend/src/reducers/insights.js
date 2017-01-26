import _ from 'lodash';

const initialState = {
  observations: {

  }
};

export default function sensorMappings(state = initialState, action) {
  switch (action.type) {
    case 'ADD_OBSERVATIONS':
      return {
        ...state,
        observations: {
          ...state.observations,
          [action.childId]: action.observations
        }
      }
    default:
      return state
  }
}
