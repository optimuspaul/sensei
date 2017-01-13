import { combineReducers } from 'redux';
import sensorMappings from './sensorMappings';
import entities from './entities';
import requests from './requests';

const rootReducer = combineReducers({
  sensorMappings,
  entities,
  requests
});

export default rootReducer;
