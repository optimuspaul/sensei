import _ from 'lodash';

const initialState = {
  locations: {},
  status: 'unfetched',
  currentCamera: '1',
  cameraSegments: [

  ],
  credentials: localStorage.getItem('TC_CAMERA_BUILDER_CREDS'),
  authenticated: !_.isNull(localStorage.getItem('TC_CAMERA_BUILDER_CREDS'))
};

export default function cameraSegmentBuilder(state = initialState, action) {
  switch (action.type) {
    case 'DEAUTHENTICATE':
      return {
        ...state,
        credentials: null,
        authenticating: false,
        authenticated: false
      }
    case 'AUTHENTICATE':
      return {
        ...state,
        credentials: action.credentials,
        authenticating: true
      }
    case 'AUTH_SUCCEEDED':
      return {
        ...state,
        authenticated: true,
        authenticating: false
      }
    case 'AUTH_FAILED':
      return {
        ...state,
        authenticated: false,
        authenticating: false
      }
    case 'FETCHING_PHOTOS':
      return {
        ...state,
        status: 'fetching'
      }
    case 'RECEIVED_PHOTOS':
      if (_.isEmpty(state.locations) && !action.date) {
        return {
          ...state,
          locations: {
            ...state.locations,
            ...action.cameraData
          },
          status: 'fetched'
        }
      }
      let cameras = _.keys(_.get(action.cameraData, `${action.location}`, {}));
      let masters = _.get(action.cameraData, `${action.location}.${cameras[0]}.${action.date}`);
      let locations = _.merge({}, state.locations);
      _.each(cameras, (camera) => {
        let myUrl = _.get(action.cameraData, `${action.location}.${camera}.${action.date}.0`);
        let myDatetime = myUrl.split('/').slice(-1)[0].match(/[0-9]{4}(.*(?=_)|.*(?=\.))/)[0];
        let images = _.map(masters, (url) => {
          let commonDatetime = url.split('/').slice(-1)[0].match(/[0-9]{4}(.*(?=_)|.*(?=\.))/)[0];
          return myUrl.replace(myDatetime,commonDatetime);
        });
        if (images) {
          _.set(locations, `${action.location}.${camera}.${action.date}`, images);
        }
      })
      return {
        ...state,
        loading: false,
        currentLocation: action.location,
        currentCamera: action.camera,
        currentDate: action.date,
        locations
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
