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

      let masters = _.find(_.get(locations, `${action.location}.camera.${action.date}`, {}), photos => !_.isEmpty(photos));
      let hasOverlays = _.includes(_.keys(_.get(locations, `${action.location}.overlays`, {})), action.date);
      if (hasOverlays && !_.includes(cameras, 'overlays')) {
        cameras.push('overlays');
      }

      let hasVideos = _.find(masters, (photo) => _.includes(photo, '.mp4'))
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
    case 'RECEIVE_CAMERA_SEGMENTS':
      return {
        ...state,
        cameraSegments: action.cameraSegments
      }
    default:
      return state
  }
}
