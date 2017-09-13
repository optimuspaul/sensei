import {connect} from 'react-redux';
import _ from 'lodash';
import InsightsDashboard from './../components/InsightsDashboard';

const InsightsDashboardContainer = connect((state) => ({
  insights: state.insights,
}),
(dispatch) => ({
  dispatch
}))(InsightsDashboard);

export default InsightsDashboardContainer;
