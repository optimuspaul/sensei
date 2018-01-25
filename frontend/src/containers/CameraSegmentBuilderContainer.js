import {connect} from 'react-redux';
import _ from 'lodash';
import CameraSegmentBuilder from './../components/CameraSegmentBuilder';
import { fetchPhotos, saveCameraSegment, fetchCameraSegments, authenticate, deauthenticate } from './../actions/cameraSegmentBuilderActions';

const CamerSegmentBuilderContainer = connect((state) => ({
  cameraData: state.cameraSegmentBuilder,
  authenticated: _.get(state, 'cameraSegmentBuilder.credentials') && _.get(state, 'cameraSegmentBuilder.authenticated') === true,
  authenticating: _.get(state, 'cameraSegmentBuilder.authenticating'),
  authFailed: _.get(state, 'cameraSegmentBuilder.authenticated') === false && _.get(state, 'cameraSegmentBuilder.credentials') && !_.get(state, 'cameraSegmentBuilder.authenticating')
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
  }
}))(CameraSegmentBuilder);

export default CamerSegmentBuilderContainer;
