import {connect} from 'react-redux';
import _ from 'lodash';
import {saveEntity, updateEntity} from '../actions/entityActions';
import ManageEntitiesInterface from './../components/ManageEntitiesInterface';

const ManageEntitiesInterfaceContainer = connect((state) => ({
  entities: state.entities,
  requests: state.requests
}),
(dispatch) => ({
  dispatch,
  saveEntity,
  updateEntity
}))(ManageEntitiesInterface);


export default ManageEntitiesInterfaceContainer;
