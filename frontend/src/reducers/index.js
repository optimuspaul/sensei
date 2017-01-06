import { combineReducers } from 'redux';
import sensorMappings from './sensorMappings';
import entities from './entities';

const rootReducer = combineReducers({
  sensorMappings,
  entities
});

export default rootReducer;
