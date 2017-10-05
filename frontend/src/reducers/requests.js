import _ from 'lodash';


export default function requests(state = {}, action) {
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
