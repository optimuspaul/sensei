import _ from 'lodash';

const initialState = {
  children: {},
  teachers: {},
  materials: {},
  areas: {},
  anonymize: localStorage.getItem('anonymize') === 'true'
};

export default function sensorMappings(state = initialState, action) {
  switch (action.type) {
    case 'ADD_ENTITIES':
      return {
        ...state,
        [action.entityType]: _.merge(state[action.entityType], _.reduce(action.entities, (current, entity) => {
          current[entity.id] = entity
          return current;
        }, {}))
      }
    case 'HANDLE_SAVE_ENTITY_SUCCESS':
      return {
        ...state,
        [action.entityType]: _.merge(state[action.entityType], {[action.entity.id]: action.entity})
      }
    case 'TOGGLE_ANONYMIZER':
      localStorage.setItem('anonymize', !state.anonymize)
      return {
        ...state,
        anonymize: !state.anonymize
      }
    default:
      return state
  }
}
