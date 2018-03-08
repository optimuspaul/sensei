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
    case 'RECEIVE_INTERACTION_PERIODS':
      date = state.ui.currentDate;
      entityUid = `${action.entityType}-${action.entityId}`;
      let ips = _.get(state, 'currentObservationsData.obs', []);
      _.each(_.values(action.interactionPeriods), (interactionPeriod) => {
        ips.push(interactionPeriod);
      });

      let transformedIps = _.reduce(ips, (current, ip) => {
        let index = _.findIndex(current.entities, (entity) => {
          return entity[0] === ip.targetEntityType && entity[1] === ip.targetEntityId;
        })
        if (index === -1) {
          current.entities.push([ip.targetEntityType, ip.targetEntityId])
          index = _.size(current.entities)-1;
        }
        current.obs[index] = current.obs[index] || [];
        current.obs[index].push([ip.startTime.toISOString(), ip.endTime.toISOString()])
        if(current.timestamps[0]) {
          let earliestTimestamp = new Date(current.timestamps[0]);
          current.timestamps[0] = earliestTimestamp > ip.startTime ? ip.startTime.toISOString() : current.timestamps[0];
        } else {
          current.timestamps[0] = ip.startTime.toISOString();
        }
        if(current.timestamps[1]) {
          let latestTimestamp = new Date(current.timestamps[1]);
          current.timestamps[1] = latestTimestamp > ip.endTime ? ip.endTime.toISOString() : current.timestamps[1];
        } else {
          current.timestamps[1] = ip.endTime.toISOString();
        }
        return current;
      }, {entities: [], obs: [], timestamps: []})

      return {
        ...state,
        observations: {
          ...state.observations,
          [entityUid]: {
            ...state.observations[entityUid],
            [date]: transformedIps
          }
        },
        currentObservationsData: transformedIps,
        ui: {
          ...state.ui,
          visualizationTitle: hasData ? `${entityName} <small>${dateString}</small>` : 'No data...'
        },
        status: 'fetched'
      }
    case 'RECEIVE_LOCATIONS':
      let obs = _.get(state, 'currentObservationsData.obs', []);
      let isLive = _.get(state, 'ui.isLive', true);
      let currentZoom = _.get(state, 'ui.zoom', true);
      _.each(_.values(action.locations), (locations) => {
        obs.push(locations)
      });

      let zoom = isLive ? _.size(obs) : currentZoom;
      obs = _.orderBy(obs, ['timestamp'], ['desc']);
      return {
        ...state,
        currentObservationsData: {
          classroomLength: action.classroomLength,
          classroomWidth: action.classroomWidth,
          obs
        },
        ui: {
          ...state.ui,
          visualizationTitle: !_.isEmpty(obs) ? `Sensor Locations` : 'No data...',
          zoom
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
        currentObservationsData: {},
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
    case 'TOGGLE_LIVE':
      return {
        ...state,
        ui: {
          ...state.ui,
          isLive: action.isLive
        }
      }
    case 'REFRESH_FROM_PARAMS':
      let params = _.pick(action.params, ['currentDate', 'endDate', 'visualization', 'interactionType', 'currentEntityType', 'currentEntityId', 'zoom']);
      params.zoom = parseInt(params.zoom);
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
