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
    case 'RECEIVED_PHOTOS':
      let locations = {...state.locations, ...action.cameraData};
      let cameras = _.keys(_.omit(_.get(action.cameraData, `${action.location}`, {}), ['classroom_info'])) || [];
      
      let vantagePoints = _.keys(_.get(action.cameraData, `${action.location}.camera.${action.date}`, {}));
      let dates = _.keys(_.get(action.cameraData, `${action.location}.camera`, {}));
      let currentLocation = action.location || state.currentLocation;
      let currentCamera = action.camera || state.currentCamera;
      let currentDate = action.date || state.currentDate;
      let currentVantagePoint = action.vangagePoint || state.currentVantagePoint;

      let masters = _.find(_.get(locations, `${action.location}.camera.${action.date}`, {}), photos => !_.isEmpty(photos));
      let hasOverlays = _.includes(_.keys(_.get(locations, `${action.location}.overlays`, {})), action.date);
      if (hasOverlays && !_.includes(cameras, 'overlays')) {
        cameras.push('overlays');
      }

      let hasVideos = _.some(_.get(locations, `${action.location}.camera.${action.date}`, {}), (masters, key) => { return !_.isUndefined(_.findLast(masters, (photo) => _.includes(photo, '.mp4'))) && key });
      if (hasVideos) {
        cameras.push('video');
      }
      
      if (masters && action.location && action.date) {
        _.each(cameras, (camera) => {
          _.set(locations, `${action.location}.${camera}.${action.date}`, []);
        });
        let firstPhoto = masters[0];
        let startDate = parsePhotoSegmentTimestamp(firstPhoto);
        let lastPhoto = masters[masters.length-1];
        let endDate = parsePhotoSegmentTimestamp(lastPhoto);

        while (startDate < endDate) {
          _.each(cameras, (camera) => {

            let url = `${action.location}/${camera}/${action.date}/camera01/still_${moment.utc(startDate).format("YYYY-MM-DD-HH-mm-ss")}${camera === 'camera' ? '.jpg' : (camera === 'video' ? '.mp4' : '_rendered.png')}`
            let photos = _.get(locations, `${action.location}.${camera}.${action.date}`);
            photos.push(url)
            _.set(locations, `${action.location}.${camera}.${action.date}`, photos);
          });
          startDate.setSeconds(startDate.getSeconds()+10);
        }
      }
      let currentPhotos = _.get(locations, `${action.location}.camera.${action.date}`, []);
      
      return {
        ...state,
        loading: false,
        currentLocation,
        currentCamera,
        currentDate,
        currentPhotos,
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
