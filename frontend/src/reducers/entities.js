import _ from 'lodash';

const initialState = {
  students: {},
  teachers: {},
  materials: {},
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
    default:
      return state
  }
}
