import {connect} from 'react-redux';
import _ from 'lodash';
import CameraSegmentBuilder from './../components/CameraSegmentBuilder';
import { fetchPhotos, saveCameraSegment, fetchCameraSegments, fetchCameraData, authenticate, deauthenticate, subscribeToCameraDataSNS, toggleLiveMode, toggleShowLocations, updateParams } from './../actions/cameraSegmentBuilderActions';
import { showLocationsAt, fetchLocations } from './../actions/insightsActions';

const CamerSegmentBuilderContainer = connect((state) => {
  let currentPhotos = _.get(state, `cameraSegmentBuilder.cameraData`, {});
  currentPhotos = _.map(_.orderBy(currentPhotos, ['timestamp'], ['asc']), p => p.Key)
  return {
    cameraData: _.get(state, 'cameraSegmentBuilder'),
    currentPhotos,
    dates: state.cameraSegmentBuilder.dates,
    authenticated: _.get(state, 'cameraSegmentBuilder.credentials') && _.get(state, 'cameraSegmentBuilder.authenticated') === true,
    authenticating: _.get(state, 'cameraSegmentBuilder.authenticating'),
    authFailed: _.get(state, 'cameraSegmentBuilder.authenticated') === false && _.get(state, 'cameraSegmentBuilder.credentials') && !_.get(state, 'cameraSegmentBuilder.authenticating'),
    sensorLocations: _.get(state, 'insights.currentObservationsData'),
    fetchLocsStatus: _.get(state, 'insights.status'),
    livePhoto: _.get(state, 'cameraSegmentBuilder.livePhoto'),
    live: _.get(state, 'cameraSegmentBuilder.live'),
    showLocations: _.get(state, 'cameraSegmentBuilder.showLocations'),
    index: _.get(state, 'cameraSegmentBuilder.index'),
    zoom: _.get(state, 'insights.ui.zoom'),
    fetchPhotosStatus: _.get(state, 'cameraSegmentBuilder.status')
  } 
},
(dispatch) => ({
  dispatch,
  authenticate: (...args) => {
    return dispatch(authenticate(...args));
  },
  toggleLiveMode: () => {
    dispatch(toggleLiveMode());
  },
  toggleShowLocations: () => {
    dispatch(toggleShowLocations());
  },
  deauthenticate: () => {
    return dispatch(deauthenticate());
  },
  fetchPhotos: (...args) => {
    dispatch(fetchPhotos(...args));
  },
  fetchCameraData: (...args) => {
    dispatch(fetchCameraData(...args));
  },
  fetchCameraSegments: (...args) => {
    dispatch(fetchCameraSegments(...args));
  },
  updateParams: (...args) => {
    dispatch(updateParams(...args));
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
    dispatch(fetchLocations(date, 24, classroomId));
  },
  showLocationsAt: (date) => {
    dispatch(showLocationsAt(date));
  }
}))(CameraSegmentBuilder);

export default CamerSegmentBuilderContainer;
