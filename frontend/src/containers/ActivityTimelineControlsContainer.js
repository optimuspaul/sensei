import {connect} from 'react-redux';
import _ from 'lodash';
import ActivityTimelineControls from './../components/ActivityTimelineControls';
import {selectEntity, selectDate} from '../actions/insightsActions';

const ActivityTimelineControlsContainer = connect((state) => ({
  insights: state.insights,
  entities: state.entities
}),
(dispatch) => ({
  dispatch,
  selectEntity,
  selectDate
}))(ActivityTimelineControls);

export default ActivityTimelineControlsContainer;
