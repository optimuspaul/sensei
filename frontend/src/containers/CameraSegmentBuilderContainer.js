import {connect} from 'react-redux';
import _ from 'lodash';
import CameraSegmentBuilder from './../components/CameraSegmentBuilder';
import { fetchPhotos, saveCameraSegment, fetchCameraSegments } from './../actions/cameraSegmentBuilderActions';

const CamerSegmentBuilderContainer = connect((state) => ({
  cameraData: state.cameraSegmentBuilder,
  segments: state.cameraSegmentBuilder.cameraSegments
}),
(dispatch) => ({
  dispatch,
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
