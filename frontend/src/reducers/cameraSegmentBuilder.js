import _ from 'lodash';
import {parsePhotoSegmentTimestamp} from './../utils';
import moment from 'moment';

const initialState = {
  locations: {},
  currentPhotos: [],
  dates: [],
  cameras: [],
  status: 'unfetched',
  currentCamera: '1',
  cameraSegments: [

  ],
  livePhoto: {},
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
        currentPhotos: [],
        currentDate: '',
        status: 'fetching'
      }
    case 'RECEIVE_PHOTOS':
      let cameraData = _.reduce(action.photos, (current, photo, id) => {
        _.set(current, [action.location, action.camera, action.date, action.vantagePoint, id.replace('.', '')], photo);
        return current;
      }, _.merge({}, state.cameraData));

      return {
        ...state,
        cameraData,
        currentLocation: action.location,
        currentCamera: action.camera,
        currentDate: action.date,
        currentVantagePoint: action.vantagePoint
      }
    case 'RECEIVED_PHOTOS':
      let locations = {...state.locations, ...action.cameraData};
      let cameras = _.keys(_.omit(_.get(action.cameraData, `${action.location}`, {}), ['classroom_info'])) || [];
      
      let vantagePoints = _.keys(_.get(action.cameraData, `${action.location}.camera.${action.date}`, {}));
      let dates = _.keys(_.get(action.cameraData, `${action.location}.camera`, {}));
      let currentLocation = action.location || state.currentLocation;
      let currentCamera = action.camera || state.currentCamera;
      let currentDate = action.date || state.currentDate;
      let currentVantagePoint = action.vangagePoint || state.currentVantagePoint;
      
      return {
        ...state,
        loading: false,
        currentLocation,
        currentCamera,
        currentDate,
        vantagePoints,
        currentVantagePoint,
        locations,
        cameras,
        dates,
        status: 'fetched'
      }
    case 'HANDLE_SAVE_CAMERA_SEGMENT_SUCCESS':
      return {
        ...state,
        cameraSegments: [
          action.cameraSegment,
          ...state.cameraSegments
        ]
      }
    case 'TOGGLE_LIVE_MODE': 
      return {
        ...state,
        live: !state.live
      }
    case 'RECEIVE_CAMERA_SEGMENTS':
      return {
        ...state,
        cameraSegments: action.cameraSegments
      }
    case 'RECEIVE_CAMERA_DATA_SNS':
      let key = action.key;
      let parsedSamplePhoto, parsedSampleVangagePoint;
      let parsed = key.split("/");
      let parsedLocation = parsed[0];
      let parsedExtension = key.split(".")[1];
      let parsedCamera = parsedExtension === 'mp4' ? 'video' : parsed[1];
      let parsedDate = parsed[2];
      let parsedVantagePoint = parsed[3];
      let samplePhoto = state.currentPhotos[0];
      let parsedTimestamp = parsePhotoSegmentTimestamp(key);
      let currentLivePhoto = _.get(state.livePhoto, `${parsedLocation}.${parsedCamera}.${parsedVantagePoint}`)
      let currentParsedTimestamp = currentLivePhoto ? parsePhotoSegmentTimestamp(`/${currentLivePhoto}`) : null;
      if (samplePhoto) {
        parsedSamplePhoto = samplePhoto.split("/");
        parsedSampleVangagePoint = parsed[3];
      }
      if (parsedDate === state.currentDate && parsedLocation === state.currentLocation && (!currentLivePhoto || (parsedTimestamp > currentParsedTimestamp))) {
        let livePhoto = _.merge({}, state.livePhoto, _.set({}, `${parsedLocation}.${parsedCamera}.${parsedVantagePoint}`, key));
        return {
          ...state,
          livePhoto
        }
      } else {
        return state;
      }
    default:
      return state
  }
}
