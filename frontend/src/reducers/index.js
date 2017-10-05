import { combineReducers } from 'redux';
import sensorMappings from './sensorMappings';
import entities from './entities';
import requests from './requests';
import insights from './insights';
import cameraSegmentBuilder from './cameraSegmentBuilder';

const rootReducer = combineReducers({
  sensorMappings,
  entities,
  requests,
  insights,
  cameraSegmentBuilder
});

export default rootReducer;
