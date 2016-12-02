import SensorMappingInterface from './SensorMappingInterface';
import React from 'react';
import ReactDOM from 'react-dom';

// TODO: real routing.
setTimeout(function(){
  if (location.pathname.endsWith('wf/events/sensors')) {
    document.title = 'Sensors';
    ReactDOM.render(<SensorMappingInterface/>, document.getElementById('foundation'));
  }
}, 200);
