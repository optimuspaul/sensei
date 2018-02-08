import _ from 'lodash';
import QueryParams from 'query-params';

let params = QueryParams.decode(location.search.slice(1));
params.currentDate = params.currentDate || (new Date((new Date()).toDateString())).toISOString();
params.selectedDays = [new Date(params.currentDate)];
params.endDate = params.endDate || (new Date((new Date()).toDateString())).toISOString();
const initialState = {
  observations: {

  },
  ui: params,
  status: 'unfetched'
};

export default function sensorMappings(state = initialState, action) {
  let selectedDays;
  switch (action.type) {
    case 'ADD_OBSERVATIONS':
      let entityUid = `${action.entityType}-${action.entityId}`
      let date = state.ui.currentDate
      let endDate = state.ui.endDate;
      let dateString = (new Date(date)).toDateString();
      if (endDate && _.includes(['studentSummary', 'unitSummary', 'socialGraph'], state.ui.visualization)) {
        dateString += ` to ${(new Date(state.ui.endDate)).toDateString()}`
      }
      let hasData = !_.isEmpty(action.observations.entities);
      let entityName = state.ui.visualization === 'socialGraph' ? '' : _.get(action, 'entity.displayName');
      let currentObservationsData = action.observations;

      return {
        ...state,
        observations: {
          ...state.observations,
          [entityUid]: {
            ...state.observations[entityUid],
            [date]: action.observations
          }
        },
        currentObservationsData,
        ui: {
          ...state.ui,
          visualizationTitle: hasData ? `${entityName} <small>${dateString}</small>` : 'No data...'
        },
        status: 'fetched'
      }
    case 'SELECT_ENTITY':
      return {
        ...state,
        observations: {
          ...state.observations
        },
        ui: {
          ...state.ui,
          currentEntityId: action.entityId,
          currentEntityType: action.entityType,
          entity: action.entity
        },
        status: 'fetching'
      }
    case 'DESELECT_ENTITY':
      let currentObs = _.keys(state.observations);
      if (_.size(currentObs) < 2) return state;
      state.observations = _.omit(state.observations, action.entityUid);
      currentObs = _.keys(state.observations);
      let prevEntity = currentObs[0];
      let prevEntityId = prevEntity.split("-")[1];
      let prevEntityType = prevEntity.split("-")[0];
      state.ui.currentEntityType = prevEntityType;
      state.ui.currentEntityId = prevEntityId;
      
      return _.merge({}, state);
    case 'SELECT_VISUALIZATION':
      return {
        ...state,
        observations: {},
        ui: {
          ...state.ui,
          visualization: action.visualization
        },
        status: 'fetching'
      }
    case 'SELECT_INTERACTION_TYPE':
      return {
        ...state,
        observations: {},
        ui: {
          ...state.ui,
          interactionType: action.interactionType
        },
        status: 'fetching'
      }
    case 'SELECT_DATE':
      return {
        ...state,
        observations: {},
        ui: {
          ...state.ui,
          currentDate: action.date
        },
        status: 'fetching'
      }
    case 'SELECT_END_DATE':
      return {
        ...state,
        observations: {},
        ui: {
          ...state.ui,
          endDate: action.endDate
        },
        status: 'fetching'
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
      let params = _.pick(action.params, ['currentDate', 'endDate', 'visualization', 'interactionType', 'currentEntityType', 'currentEntityId', 'zoom']);
      return {
        ...state,
        observations: {
          ...state.observations
        },
        ui: {
          ...state.ui,
          ...params
        },
        status: 'fetching'
      }
    default:
      return state
  }
}
