import _ from 'lodash';
import QueryParams from 'query-params';

let params = QueryParams.decode(location.search.slice(1));
params.currentDate = params.currentDate || (new Date((new Date()).toDateString())).toISOString();
params.endDate = params.endDate || (new Date((new Date()).toDateString())).toISOString();
const initialState = {
  observations: {

  },
  ui: params
};

export default function sensorMappings(state = initialState, action) {
  switch (action.type) {
    case 'ADD_OBSERVATIONS':
      let entityUid = `${action.entityType}-${action.entityId}`
      return {
        ...state,
        observations: {
          ...state.observations,
          [entityUid]: action.observations
        }
      }
    case 'SELECT_ENTITY':
      return {
        observations: {},
        ui: {
          ...state.ui,
          currentEntityId: action.entityId,
          currentEntityType: action.entityType
        }
      }
    case 'SELECT_VISUALIZATION':
      return {
        observations: {},
        ui: {
          ...state.ui,
          visualization: action.visualization
        }
      }
    case 'SELECT_DATE':
      return {
        observations: {},
        ui: {
          ...state.ui,
          currentDate: action.date
        }
      }
    case 'SELECT_END_DATE':
      return {
        observations: {},
        ui: {
          ...state.ui,
          endDate: action.endDate
        }
      }
    case 'SET_ZOOM':
      return {
        ...state,
        ui: {
          ...state.ui,
          zoom: parseInt(action.zoom)
        }
      }
    case 'REFRESH_FROM_PARAMS':
      return {
        observations: {},
        ui: _.pick(action.params, ['currentDate', 'endDate', 'visualization', 'currentEntityType', 'currentEntityId', 'zoom'])
      }
    default:
      return state
  }
}
