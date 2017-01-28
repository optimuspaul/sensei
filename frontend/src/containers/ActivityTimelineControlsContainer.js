import {connect} from 'react-redux';
import _ from 'lodash';
import ActivityTimelineControls from './../components/ActivityTimelineControls';
import {selectChild, selectDate} from '../actions/insightsActions';

const ActivityTimelineControlsContainer = connect((state) => ({
  insights: state.insights,
  entities: state.entities
}),
(dispatch) => ({
  dispatch,
  selectChild,
  selectDate
}))(ActivityTimelineControls);

export default ActivityTimelineControlsContainer;
