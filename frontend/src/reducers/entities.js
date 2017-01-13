import _ from 'lodash';

const initialState = {
  children: {},
  teachers: {},
  materials: {},
  areas: {},
  loading: false
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
    default:
      return state
  }
}
