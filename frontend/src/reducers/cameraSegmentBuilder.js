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
  currentCamera: params.currentCamera,
  currentLocation: params.currentLocation,
  livePhoto: {},
  live: params.live === 'true',
  showLocations: params.showLocations === 'true',
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
      let latest = _.map(cameraData, p => p.Key).pop();
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
    case 'TOGGLE_SHOW_LOCATIONS': 
      return {
        ...state,
        showLocations: !state.showLocations
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
