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
    case 'RECEIVE_LOCATIONS':
      let obs = _.get(state, 'currentObservationsData.obs', []);
      obs.push(action.locations)
      obs = _.orderBy(obs, ['timestamp', 'desc']);
      return {
        ...state,
        currentObservationsData: {
          classroomHeight: action.classroomHeight,
          classroomWidth: action.classroomWidth,
          obs
        },
        ui: {
          ...state.ui,
          visualizationTitle: !_.isEmpty(action.sensors) ? `Sensor Locations` : 'No data...',
          zoom: parseInt(_.size(obs))
        },
        status: 'fetched'
      }
    case 'SELECT_ENTITY':
      return {
        ...state,
        observations: {},
        ui: {
          ...state.ui,
          currentEntityId: action.entityId,
          currentEntityType: action.entityType,
          entity: action.entity
        },
        status: 'fetching'
      }
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
        observations: state.observations,
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
