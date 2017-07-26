import {connect} from 'react-redux';
import _ from 'lodash';
import ActivityTimelineControls from './../components/ActivityTimelineControls';
import {selectEntity, selectDate, selectEndDate, selectVisualization, refreshFromParams, setZoom} from '../actions/insightsActions';

const ActivityTimelineControlsContainer = connect((state) => ({
  insights: state.insights,
  entities: state.entities
}),
(dispatch) => ({
  dispatch,
  selectEntity,
  selectVisualization,
  selectDate,
  selectEndDate,
  setZoom,
  refreshFromParams
}))(ActivityTimelineControls);

export default ActivityTimelineControlsContainer;
