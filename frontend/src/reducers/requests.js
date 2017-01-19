import _ from 'lodash';


export default function sensorMappings(state = {}, action) {
  switch (action.type) {
    case 'HANDLE_REQUEST':
      return {
        ...state,
        [action.requestId]: {
          status: action.requestStatus,
          payload: action.payload
        }
      }
    default:
      return state
  }
}