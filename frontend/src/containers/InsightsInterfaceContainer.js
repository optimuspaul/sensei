import {connect} from 'react-redux';
import _ from 'lodash';
import InsightsInterface from './../components/InsightsInterface';

const InsightsInterfaceContainer = connect((state) => ({
  insights: state.insights,
}),
(dispatch) => ({
  dispatch
}))(InsightsInterface);

export default InsightsInterfaceContainer;
