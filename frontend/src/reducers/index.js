import { combineReducers } from 'redux';
import sensorMappings from './sensorMappings';
import entities from './entities';
import requests from './requests';
import insights from './insights';

const rootReducer = combineReducers({
  sensorMappings,
  entities,
  requests,
  insights
});

export default rootReducer;
