import _ from 'lodash';
import QueryParams from 'query-params';

let params = QueryParams.decode(location.search.slice(1));
params.currentDate = params.currentDate || (new Date((new Date()).toDateString())).toISOString();
params.currentDate = params.currentDate.split('T')[0]
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
      if (endDate) {
        dateString += ` to ${(new Date(state.ui.currentDate)).toDateString()}`
      }
      let hasData = _.isEmpty(action.observations.entities);
      let entityName = _.get(state, 'ui.entity.displayName');
      return {
        ...state,
        observations: {
          ...state.observations,
          [entityUid]: {
            ...state.observations[entityUid],
            [date]: action.observations
          }
        },
        currentObservationsData: action.observations,
        ui: {
          ...state.ui,
          visualizationTitle: hasData ? `${entityName} <small>${dateString}</small>` : 'No data...'
        },
        status: 'fetched'
      }
    case 'SELECT_ENTITY':
      return {
        observations: {},
        ui: {
          ...state.ui,
          currentEntityId: action.entityId,
          currentEntityType: action.entityType
        },
        status: 'fetching'
      }
    case 'SELECT_VISUALIZATION':
      return {
        observations: {},
        ui: {
          ...state.ui,
          visualization: action.visualization
        },
        status: 'fetching'
      }
    case 'SELECT_INTERACTION_TYPE':
      return {
        observations: {},
        ui: {
          ...state.ui,
          interactionType: action.interactionType
        },
        status: 'fetching'
      }
    case 'SELECT_DATE':
      return {
        observations: {},
        ui: {
          ...state.ui,
          currentDate: action.date
        },
        status: 'fetching'
      }
    case 'SELECT_END_DATE':
      return {
        observations: {},
        ui: {
          ...state.ui,
          endDate: action.endDate
        },
        status: 'fetching'
      }
    case 'ADD_DAY':
      selectedDays = state.ui.selectedDays;
      selectedDays.push(action.date);
      return {
        observations: state.observations,
        ui: {
          ...state.ui,
          selectedDays,
          currentDate: action.date.toISOString()
        },
        status: 'fetching'
      }
    case 'REMOVE_DAY':
      selectedDays = state.ui.selectedDays;
      _.remove(selectedDays, (day) => {
        return _.isEqual(action.date, day);
      });
      return {
        observations: state.observations,
        ui: {
          ...state.ui,
          selectedDays
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
