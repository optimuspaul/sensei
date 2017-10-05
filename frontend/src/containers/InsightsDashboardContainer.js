import {connect} from 'react-redux';
import _ from 'lodash';
import InsightsDashboard from './../components/InsightsDashboard';
import entityInflections from './../utils';

const InsightsDashboardContainer = connect((state) => ({
  insights: state.insights,
  defaultEntity: _.values(_.get(state, 'entities.children', []))[0] || {}
}),
(dispatch) => ({
  dispatch
}))(InsightsDashboard);

export default InsightsDashboardContainer;
