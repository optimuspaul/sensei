import {connect} from 'react-redux';
import _ from 'lodash';
import CameraSegmentBuilder from './../components/CameraSegmentBuilder';
import { fetchPhotos, saveCameraSegment, fetchCameraSegments, authenticate, deauthenticate } from './../actions/cameraSegmentBuilderActions';
import { showLocationsAt, fetchLocations } from './../actions/insightsActions';

const CamerSegmentBuilderContainer = connect((state) => ({
  cameraData: state.cameraSegmentBuilder,
  authenticated: _.get(state, 'cameraSegmentBuilder.credentials') && _.get(state, 'cameraSegmentBuilder.authenticated') === true,
  authenticating: _.get(state, 'cameraSegmentBuilder.authenticating'),
  authFailed: _.get(state, 'cameraSegmentBuilder.authenticated') === false && _.get(state, 'cameraSegmentBuilder.credentials') && !_.get(state, 'cameraSegmentBuilder.authenticating'),
  sensorLocations: _.get(state, 'insights.currentObservationsData'),
  fetchLocsStatus: _.get(state, 'insights.status'),
  zoom: _.get(state, 'insights.ui.zoom'),
  fetchPhotosStatus: _.get(state, 'cameraSegmentBuilder.status')
}),
(dispatch) => ({
  dispatch,
  authenticate: (...args) => {
    return dispatch(authenticate(...args));
  },
  deauthenticate: () => {
    return dispatch(deauthenticate());
  },
  fetchPhotos: (...args) => {
    dispatch(fetchPhotos(...args));
  },
  fetchCameraSegments: (...args) => {
    dispatch(fetchCameraSegments(...args));
  },
  saveCameraSegment: (...args) => {
    dispatch(saveCameraSegment(...args));
  },
  handleDateChange: (currentLocation, currentCamera, newDate, currentTimestamp, classroomId) => {
    dispatch(fetchPhotos(currentLocation, currentCamera, newDate));
    dispatch(fetchCameraSegments(currentLocation, newDate));
  },
  fetchSensorLocations: (date, classroomId) => {
    date = new Date(date);
    dispatch(fetchLocations(date, 2, classroomId));
  },
  showLocationsAt: (date) => {
    dispatch(showLocationsAt(date));
  }
}))(CameraSegmentBuilder);

export default CamerSegmentBuilderContainer;
