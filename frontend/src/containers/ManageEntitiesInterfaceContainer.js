import {connect} from 'react-redux';
import _ from 'lodash';
import ManageEntitiesInterface from './../components/ManageEntitiesInterface';

const ManageEntitiesInterfaceContainer = connect((state) => ({
}),
(dispatch) => ({
  dispatch
}))(ManageEntitiesInterface);


export default ManageEntitiesInterfaceContainer;
