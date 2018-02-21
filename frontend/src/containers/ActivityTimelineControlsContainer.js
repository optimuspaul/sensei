import {connect} from 'react-redux';
import _ from 'lodash';
import ActivityTimelineControls from './../components/ActivityTimelineControls';
import {selectEntity, selectDate, selectEndDate, selectVisualization, refreshFromParams, selectInteractionType, setZoom, toggleLive, addDay, removeDay} from '../actions/insightsActions';

const ActivityTimelineControlsContainer = connect((state) => ({
  insights: state.insights,
  entities: state.entities
}),
(dispatch) => ({
  dispatch,
  selectEntity,
  selectVisualization,
  selectInteractionType,
  selectDate,
  selectEndDate,
  setZoom,
  refreshFromParams,
  addDay,
  removeDay,
  toggleLive
}))(ActivityTimelineControls);

export default ActivityTimelineControlsContainer;
