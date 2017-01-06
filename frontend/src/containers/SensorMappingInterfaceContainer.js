import {connect} from 'react-redux';
import {saveMapping, commitMappings} from '../actions/sensorMappingActions';
import _ from 'lodash';
import SensorMappingInterface from './../components/SensorMappingInterface';

const SensorMappingInterfaceContainer = connect((state) => ({
  mappings: state.sensorMappings,
  entities: state.entities
}),
(dispatch) => ({
  dispatch,
  saveMapping,
  commitMappings
}))(SensorMappingInterface);


export default SensorMappingInterfaceContainer;
