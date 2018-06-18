import React from 'react';
import _ from 'lodash';
import './CameraSegmentBuilder.css';
import Spinner from './Spinner';
import { Carousel, FormGroup, FormControl, ControlLabel, HelpBlock, Button, OverlayTrigger, Tooltip, Badge } from 'react-bootstrap';
import {getSenseiToken,  baseUrl, vantagePoints} from './../constants';
import CameraSegmentBuilderCarousel from './CameraSegmentBuilderCarousel';
import KeyHandler, {KEYDOWN} from 'react-key-handler';
import ProximitySegmentsEditor from './ProximitySegmentsEditor';
import {locations} from './../visualizations';
import QueryParams from 'query-params';
import { history, getKeyTime, parsePhotoSegmentTimestamp } from './../utils';
import moment from 'moment';
import momentTimezoneSetup from 'moment-timezone';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import CameraViewerControls from './CameraViewerControls';
import AuthForm from './AuthForm';

class CameraSegmentBuilder extends React.Component {

  constructor(props) {
    super(props);

    let params = QueryParams.decode(location.search.slice(1)) || {};

    this.state = {
      currentLocation: '',
      currentCamera: '',
      currentVantagePoint: '',
      currentDate: '',
      index: 0,
      carouselIndex: 0,
      page: 0,
      photos: [],
      showLocations: params.locations === 'show',
      segments: true
    }
  }

  updateQueryParam(paramObj = {}) {
    let params = QueryParams.decode(location.search.slice(1)) || {};
    history.push({
      search: QueryParams.encode(_.merge(params, paramObj))
    });
  }

  getTimezone(cameraData = this.props.cameraData) {
    return _.get(this.props.cameraData, `locations.${this.state.currentLocation}.classroom_info.timezone`, 'US/Eastern');
  }

  getClassroomId(cameraData = this.props.cameraData) {
    return _.get(this.props.cameraData, `locations.${this.state.currentLocation}.classroom_info.classroom_id`, []);
  }

  getCurrentTime(photoUrl, currentPhotos = this.props.currentPhotos) {
    let currentPhoto = photoUrl || this.getCurrentPhoto(currentPhotos);
    return currentPhoto && parsePhotoSegmentTimestamp(currentPhoto);
  }

  getIndexTime = (index = this.state.index) => {
    return moment(this.state.currentDate).tz(this.getTimezone()).startOf('day').add(10*index, 's').utc().format("YYYY-MM-DD-HH-mm-ss");
  }

  getCurrentKey = (index = this.state.index) => {
    let timestamp = this.getIndexTime(index)
    return `${this.state.currentCamera === 'video' ? 'video_' : 'still_'}${timestamp}${this.state.currentCamera === 'overlays' ? '_rendered' : ''}${this.state.currentCamera === 'video' ? '.mp4' : (this.state.currentCamera === 'overlays' ? '.png' : '.jpg')}`;
  }

  checkForCurrentPhoto = (index = this.state.index) => {
    if (this.state.currentLocation && this.state.currentCamera && this.state.currentDate && this.state.currentVantagePoint) {
      return _.get(this.props.cameraData, ['cameraData', this.getIndexTime(index), `${this.state.currentVantagePoint}-${this.state.currentCamera}`], '');
    }
  }

  getCurrentPhoto = (index = this.state.index) => {
    if (this.state.currentLocation && this.state.currentCamera && this.state.currentDate && this.state.currentVantagePoint) {
      return `${this.state.currentLocation}/${this.state.currentCamera === 'video' ? 'camera' : this.state.currentCamera}/${this.state.currentDate}/${this.state.currentVantagePoint}/${this.getCurrentKey(index)}`;
    }
    return '';
  }

  moveCarousel = (event) => {
    event.preventDefault();
    let index = this.state.index;
    let delta = (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 10 : 1);
    index += delta;
    this.setState({index});
    this.updateQueryParam({index});
  }

  componentDidMount() {
    this.props.fetchCameraData();
    let params = QueryParams.decode(location.search.slice(1));

    if (params.currentLocation && params.currentDate){
      this.props.handleDateChange(params.currentLocation, params.currentCamera || 'camera', params.currentDate, params.currentVantagePoint);
      this.setState(_.omit(params));
    } else {
      history.push({
        search: QueryParams.encode({})
      });
      
    }
    if (this.state.showLocations) {
      setTimeout(locations, 1000);
    }
  }

  updateLocations(sensorLocations) {
    let vizElement = document.querySelector(`#visualization #locations`);
    if (vizElement) {
      var event = new CustomEvent('dataChanged', { detail: sensorLocations || _.get(this.props, 'sensorLocations') });
      vizElement.dispatchEvent(event);
    }
  }

  componentWillUpdate(nextProps, nextState) {
    
    let currentTime = this.getCurrentTime(nextProps.currentPhotos[0]);
    let classroomId = _.get(nextProps.cameraData.locations, `${nextState.currentLocation}.classroom_info.classroom_id`);
    if (nextState.currentDate && !_.isEqual(nextState.currentDate, this.state.currentDate) && currentTime && classroomId && this.state.showLocations) {
      this.props.fetchSensorLocations(currentTime, classroomId);
    }
    if (!_.isEqual(nextState.index, this.state.index)) {
      let nextPhoto = _.get(nextProps.cameraData.locations, `${nextState.currentLocation}.${nextState.currentCamera}.${nextState.currentDate}.${nextState.index}`);
      if (this.state.showLocations) {
        this.props.showLocationsAt(this.getCurrentTime(nextPhoto));
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    let nextLocs = _.get(nextProps, 'sensorLocations.obs');
    let prevLocs = _.get(this.props, 'sensorLocations.obs');
    let nextSensorLocations = _.get(nextProps, 'sensorLocations');
    if (((!_.isEqual(nextLocs, prevLocs) && !_.isEmpty(nextLocs)) || !_.isEqual(this.props.zoom, nextProps.zoom)) && this.state.showLocations) {
      this.updateLocations(nextSensorLocations);
    }
    if (nextProps.live) {
      this.setState({index: nextProps.index});
      this.updateQueryParam({index: nextProps.index});
    }

    if (!nextProps.live && _.size(nextProps.currentPhotos) !== _.size(this.props.currentPhotos)) {
      if (this.state.showLocations) {
        this.props.fetchSensorLocations(this.getCurrentTime(nextProps.currentPhotos[0]), _.get(nextProps.cameraData.locations, `${this.state.currentLocation}.classroom_info.classroom_id`));
      }

      let params = QueryParams.decode(location.search.slice(1));;

      this.setState({authenticating: nextProps.authenticating, live: this.props.live});
    }

  }

  handleControlsChanged = (nextSettings) => {
    if (this.props.live !== nextSettings.live) {
      if (!nextSettings.live) {
        nextSettings.index = (_.size(this.props.currentPhotos)-1);
      }
      this.props.toggleLiveMode();
    }
    if (!this.props.showLocations && nextSettings.showLocations) {
      this.props.fetchSensorLocations(this.getCurrentTime(this.props.currentPhotos[0]), this.getClassroomId());
      setTimeout(locations, 1000);
    }
    this.props.fetchPhotos(nextSettings.currentLocation, nextSettings.currentCamera, nextSettings.currentDate, nextSettings.currentVantagePoint)
    this.setState(nextSettings);
    this.updateQueryParam(nextSettings);
  }


  handleSliderChange = _.throttle((index) => {
    console.log("slider changed index to: ", index);
    this.updateQueryParam({index});
    this.setState({index});
  }, 1000)

  handleScatterClick = (data) => {
    this.updateQueryParam({index: data.index+18});
    this.setState({index: data.index+18});
  }

  render() {

    let locationsViz = (
      <div className="row">
        <div className="col" id="foundation">
          {this.props.fetchLocsStatus === 'fetching' ? <Spinner /> : ''}
          <div id='visualization'>
            <div id='locations'>
              <svg></svg>
            </div>
          </div>
        </div>
      </div>
    )
    let livePhoto = '';
    let key = this.getCurrentPhoto();
    if (key) {
      let livePhotoUrl = `${baseUrl()}/api/v1/camera_data/signed_url/${key}`;
      livePhoto = (
        <div className="row live-photo-wrapper">
          <div className="col-md-12">
            { this.state.currentCamera === 'video' ? <video controls autoPlay key={key} className="live-photo"><source src={livePhotoUrl} type="video/mp4"/></video> : <img src={livePhotoUrl} className="live-photo" /> }
            <h3>{moment(parsePhotoSegmentTimestamp(key)).tz(this.getTimezone()).format("h:mm:ss A z")}</h3>
          </div>
        </div>
      )
    }

    let slider = (
      <div className="row">
        <div className="col-md-12">
          <input
            id="zoom-slider"
            type="range"
            value={this.state.index}
            min="2160"
            max="6444"
            step="1"
            onChange={(event) => { this.handleSliderChange(parseInt(event.target.value, 10)) } }
          />
        </div>
      </div>
    )

    let scatterData = _.times(119, (i) => {
      i+=60
      let value = _.sum(_.times(36, (j) => {
        return this.checkForCurrentPhoto((i*36)+j) ? 1 : 0;
      }))
      return {index: i*36, value, interval: `${moment.duration(i*36*10, 'seconds').asHours()}h`}
    });

    const domain = [
      0,
      Math.max.apply(null, [
        ...scatterData.map(entry => entry.value)
      ])
    ];
    const range = [0, 36];

    let scatterMap = (
      <div className="row">
        <div className="col-md-12">
          <ResponsiveContainer  width="100%" height={60}>
            <ScatterChart margin={{top: 10, right: 0, bottom: 0, left: 0}}>
              <XAxis type="category" dataKey="interval" interval={9}  tickLine={false} />
              <YAxis type="number" dataKey="index" name="photos" height={5} width={0} tick={false} tickLine={false} axisLine={false} />
              <ZAxis type="number" dataKey="value" domain={domain} range={range} />
              {/*<Tooltip cursor={{strokeDasharray: '3 3'}} wrapperStyle={{ zIndex: 100 }} content={this.renderTooltip} />*/}
              <Scatter data={scatterData} fill='#8884d8' onClick={this.handleScatterClick}/>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    )

    return (
      <div>
        
        
        <KeyHandler keyEventName={KEYDOWN} keyValue="ArrowRight" onKeyHandle={this.moveCarousel} />
        <KeyHandler keyEventName={KEYDOWN} keyValue="ArrowLeft" onKeyHandle={this.moveCarousel} />
        <nav className="navbar navbar-default">
          <div className="container-fluid">
            <div className="navbar-header">
              <a className="navbar-brand" href="/">Wildflower Schools Camera Viewer</a>
            </div>
            {this.props.authenticated ? <CameraViewerControls {...this.props.cameraData} onControlsChanged={this.handleControlsChanged}/> : <AuthForm authStatus={this.props.authenticating} authFailed={this.props.authFailed} onSubmit={this.props.authenticate} /> }
            <ul id="logout-actions" className={`nav navbar-nav navbar-right ${this.props.authenticated ? '' : 'hidden'}`}>
              <li><a id="logout" onClick={this.props.deauthenticate} href="#">Sign out</a></li>
            </ul>
          </div>
        </nav>
        <div className="photo-container container-fluid">
          <div className="row">
            <div className={this.state.showSegmentBuilder || this.state.showLocations ? `col-xs-12 col-sm-6 col-lg-8` : `col-xs-12`}>
              {scatterMap}
              {slider}
              {this.props.authenticated && !_.isEmpty(this.props.currentPhotos) ? livePhoto : this.props.fetchPhotosStatus === 'fetching' ? <Spinner className="spinner" useLayout="true" /> : 'No cameras found'}
            </div>
            { this.state.showSegmentBuilder || this.state.showLocations ? (
              <div className="col-xs-12 col-sm-6 col-lg-4">
                {this.state.showLocations ? locationsViz : ''}
                <div className="row">
                  <div className="col">
                    {this.state.currentLocation && this.state.showSegmentBuilder ? <ProximitySegmentsEditor segments={this.props.segments} getCurrentTime={this.getCurrentTime.bind(this)} currentLocation={this.state.currentLocation} onSave={this.props.saveCameraSegment} /> : ''}
                  </div>
                </div>
              </div>
            ) : ''}
          </div>
          
        </div>
        <div id="export-modal" className="modal fade" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 className="modal-title">Sensor Segments</h4>
              </div>
              <div className="modal-body">
                <p className="text-muted">Copy and paste from the content below to export data.</p>
                <div className="form-group">
                  <textarea className="form-control" readOnly="true"></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default CameraSegmentBuilder;
