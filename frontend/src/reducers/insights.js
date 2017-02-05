import _ from 'lodash';

const initialState = {
  observations: {

  },
  ui: {
    currentDate: (new Date()).toISOString()
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
    case 'SELECT_CHILD':
      return {
        ...state,
        ui: {
          ...state.ui,
          currentChildId: action.childId
        }
      }
    case 'SELECT_DATE':
      return {
        ...state,
        ui: {
          ...state.ui,
          currentDate: action.date
        }
      }
    default:
      return state
  }
}
