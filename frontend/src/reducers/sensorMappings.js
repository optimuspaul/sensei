import _ from 'lodash';

const initialState = {
  student: {},
  teacher: {},
  material: {},
  area: {},
  loading: false
};

export default function sensorMappings(state = initialState, action) {
  switch (action.type) {
    case 'ADD_MAPPINGS':
      return _.merge(state.sensors, _.reduce(action.mappings, (current, mapping) => {
          current[mapping.entityType][mapping.entityId] = mapping
          return current;
        }, state));
    case 'UPDATE_MAPPING':
      return Object.assign({}, _.reduce(['student', 'teacher', 'material', 'area'], (current, entityType) => {
        current[entityType] = _.pickBy(current[entityType], (s) => {
          return s.sensorId !== action.mapping.sensorId || action.mapping.entityId === null;
        });
        if (entityType === action.mapping.entityType) {
          current[action.mapping.entityType][action.mapping.entityId] = action.mapping
        }
        return current;
      }, state));
    default:
      return state
  }
}
