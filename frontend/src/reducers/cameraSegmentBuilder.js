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
      let cameras = _.keys(_.get(action.cameraData, `${action.location}`, {}));
      let masters = _.get(action.cameraData, `${action.location}.${cameras[0]}.${action.date}`);

      _.each(cameras, (camera) => {
        let myUrl = _.get(action.cameraData, `${action.location}.${camera}.${action.date}.0`);
        let myDatetime = myUrl.split('/').slice(-1)[0].match(/[0-9]{4}(.*(?=_)|.*(?=\.))/)[0];
        let images = _.map(masters, (url) => {
          let commonDatetime = url.split('/').slice(-1)[0].match(/[0-9]{4}(.*(?=_)|.*(?=\.))/)[0];
          return myUrl.replace(myDatetime,commonDatetime);
        });
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
