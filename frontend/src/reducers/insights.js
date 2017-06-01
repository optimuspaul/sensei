import _ from 'lodash';

const initialState = {
  observations: {

  },
  ui: {
    currentDate: new Date((new Date()).toDateString())
  }
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
        ...state,
        ui: {
          ...state.ui,
          currentEntityId: action.entityId,
          currentEntityType: action.entityType
        }
      }
    case 'SELECT_VISUALIZATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          visualization: action.visualization
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
    case 'SELECT_END_DATE':
      return {
        ...state,
        ui: {
          ...state.ui,
          endDate: action.endDate
        }
      }
    default:
      return state
  }
}
