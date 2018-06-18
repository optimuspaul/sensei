import _ from 'lodash';
import {parsePhotoSegmentTimestamp} from './../utils';
import moment from 'moment';
import QueryParams from 'query-params';

let params = QueryParams.decode(location.search.slice(1)) || {};

const initialState = {
  locations: {},
  currentPhotos: [],
  dates: [],
  cameras: [],
  status: 'unfetched',
  currentCamera: '1',
  cameraSegments: [

  ],
  currentDate: params.currentDate,
  currentVantagePoint: params.currentVantagePoint,
  currentCAmera: params.currentCAmera,
  livePhoto: {},
  live: params.live === 'true',
  index: 0,
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
        cameraData: {},
        currentPhotos: [],
        currentDate: '',
        status: 'fetching'
      }
    case 'UPDATE_PARAMS':
      return {
        ...state,
        currentLocation: action.location,
        currentCamera: action.camera,
        currentDate: action.date,
        currentVantagePoint: action.vantagePoint,
        index: 0
      }
    case 'RECEIVE_PHOTOS':
      let cameraData = {};
      let index = state.index;

      cameraData = _.reduce(action.photos, (current, photo, id) => {
        _.set(current, [id], photo);
        return current;
      }, _.merge({}, state.cameraData));
      let latest = _.map(action.photos, p => p.Key).pop();
      if (latest) {
        if (action.location !== state.currentLocation || action.camera !== state.currentCamera || action.date !== state.currentDate || action.vantagePoint !== state.currentVantagePoint) {
          index = 0;
        }
        let secondsDiff = moment(parsePhotoSegmentTimestamp(latest)).utc().tz('US/Eastern').diff(moment(currentDate).utc().tz('US/Eastern').startOf('day'), 'seconds');
        let newIndex = secondsDiff/10;
        index = (_.includes(latest, `${action.location}/${action.camera}/${action.date}/${action.vantagePoint}`) && newIndex > state.index) ? newIndex : state.index;
      }

      return {
        ...state,
        cameraData,
        index,
        currentLocation: action.location,
        currentCamera: action.camera,
        currentDate: action.date,
        currentVantagePoint: action.vantagePoint
      }
    case 'RECEIVED_CAMERA_DATA':
      let locations = {...state.locations, ...action.cameraData};
      let currentLocation = action.location || state.currentLocation;
      let currentCamera = action.camera || state.currentCamera;
      let currentDate = action.date || state.currentDate;
      let currentVantagePoint = action.vangagePoint || state.currentVantagePoint;
      return {
        ...state,
        cameraData: _.merge(action.cameraData, state.cameraData),
        currentLocation,
        currentCamera,
        currentDate,
        locations,
        currentVantagePoint,
        loading: false,
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
