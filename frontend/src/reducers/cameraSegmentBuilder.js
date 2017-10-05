import _ from 'lodash';

const initialState = {
  locations: {},
  loading: false,
  currentCamera: '1',
  cameraSegments: [

  ]
};

export default function cameraSegmentBuilder(state = initialState, action) {
  switch (action.type) {
    case 'RECEIVED_PHOTOS':
      if (_.isEmpty(state.locations) && !action.date) {
        return {
          ...state,
          locations: {
            ...state.locations,
            ...action.cameraData
          }
        }
      }
      _.each(_.keys(_.get(action.cameraData, `${action.location}`, {})), (camera) => {
        let images = _.get(action.cameraData, `${action.location}.${camera}.${action.date}`);
        if (images) {
          _.set(state.locations, `${action.location}.${camera}.${action.date}`, images);
        }
      })
      return {
        ...state,
        loading: false,
        currentLocation: action.location,
        currentCamera: action.camera,
        currentDate: action.date
      }
    case 'HANDLE_SAVE_CAMERA_SEGMENT_SUCCESS':
      return {
        ...state,
        cameraSegments: [
          action.cameraSegment,
          ...state.cameraSegments
        ]
      }
    case 'RECEIVE_CAMERA_SEGMENTS':
      return {
        ...state,
        cameraSegments: action.cameraSegments
      }
    default:
      return state
  }
}
