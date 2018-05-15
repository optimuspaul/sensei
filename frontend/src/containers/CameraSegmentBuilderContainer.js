import {connect} from 'react-redux';
import _ from 'lodash';
import CameraSegmentBuilder from './../components/CameraSegmentBuilder';
import { fetchPhotos, saveCameraSegment, fetchCameraSegments, authenticate, deauthenticate, subscribeToCameraDataSNS, toggleLiveMode } from './../actions/cameraSegmentBuilderActions';
import { showLocationsAt, fetchLocations } from './../actions/insightsActions';

const CamerSegmentBuilderContainer = connect((state) => ({
  cameraData: state.cameraSegmentBuilder,
  currentPhotos: state.cameraSegmentBuilder.currentPhotos,
  vantagePoints: state.cameraSegmentBuilder.vantagePoints,
  dates: state.cameraSegmentBuilder.dates,
  authenticated: _.get(state, 'cameraSegmentBuilder.credentials') && _.get(state, 'cameraSegmentBuilder.authenticated') === true,
  authenticating: _.get(state, 'cameraSegmentBuilder.authenticating'),
  authFailed: _.get(state, 'cameraSegmentBuilder.authenticated') === false && _.get(state, 'cameraSegmentBuilder.credentials') && !_.get(state, 'cameraSegmentBuilder.authenticating'),
  sensorLocations: _.get(state, 'insights.currentObservationsData'),
  fetchLocsStatus: _.get(state, 'insights.status'),
  livePhoto: _.get(state, 'cameraSegmentBuilder.livePhoto'),
  live: _.get(state, 'cameraSegmentBuilder.live'),
  zoom: _.get(state, 'insights.ui.zoom'),
  fetchPhotosStatus: _.get(state, 'cameraSegmentBuilder.status')
}),
(dispatch) => ({
  dispatch,
  authenticate: (...args) => {
    return dispatch(authenticate(...args));
  },
  subscribeToCameraDataSNS: () => {
    dispatch(subscribeToCameraDataSNS());
  },
  toggleLiveMode: () => {
    dispatch(toggleLiveMode());
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
  handleDateChange: (currentLocation, currentCamera, newDate, currentVantagePoint, currentTimestamp, classroomId) => {
    dispatch(fetchPhotos(currentLocation, currentCamera, newDate, currentVantagePoint));
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
