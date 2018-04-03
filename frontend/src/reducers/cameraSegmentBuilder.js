import _ from 'lodash';
import {parsePhotoSegmentTimestamp} from './../utils';
import moment from 'moment';

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
      let cameras = _.keys(_.omit(_.get(action.cameraData, `${action.location}`, {}), ['classroom_info']));
      let locations = _.merge({[action.location]: { classroom_info: _.get(action.cameraData, `${action.location}.classroom_info`) } }, state.locations);
      let masters = _.get(action.cameraData, `${action.location}.${cameras[0]}.${action.date}.camera01`);
      let vantagePoints = _.keys(_.get(action.cameraData, `${action.location}.${cameras[0]}.${action.date}`));
      if (masters) {
        _.each(cameras, (camera) => {
          _.set(locations, `${action.location}.${camera}.${action.date}`, []);
        });
        let firstPhoto = masters[0];
        let startDate = parsePhotoSegmentTimestamp(firstPhoto);
        let lastPhoto = masters[masters.length-1];
        let endDate = parsePhotoSegmentTimestamp(lastPhoto);
        while (startDate < endDate) {
          _.each(cameras, (camera) => {
            let url = `${action.location}/${camera}/${action.date}/camera01/still_${moment.utc(startDate).format("YYYY-MM-DD-HH-mm-ss")}${camera === 'camera' ? '.jpg' : '_rendered.png'}`
            let photos = _.get(locations, `${action.location}.${camera}.${action.date}`);
            photos.push(url)
            _.set(locations, `${action.location}.${camera}.${action.date}`, photos);
          });
          startDate.setSeconds(startDate.getSeconds()+10);
        }
      }
      return {
        ...state,
        loading: false,
        currentLocation: action.location,
        currentCamera: action.camera,
        currentDate: action.date,
        vantagePoints,
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
