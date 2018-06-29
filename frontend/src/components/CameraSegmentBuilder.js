import React from 'react';
import _ from 'lodash';
import './CameraSegmentBuilder.css';
import Spinner from './Spinner';
import { Carousel, FormGroup, FormControl, ControlLabel, HelpBlock, Button, OverlayTrigger, Tooltip, Badge } from 'react-bootstrap';
import {getSenseiToken,  baseUrl, vantagePoints} from './../constants';
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

    this.state = {
    }
  }

  updateQueryParam(paramObj = {}) {
    let params = QueryParams.decode(location.search.slice(1)) || {};
    history.push({
      search: QueryParams.encode(_.merge(params, paramObj))
    });
  }

  getCurrentTime(photoUrl, currentPhotos = this.props.currentPhotos) {
    let currentPhoto = photoUrl || this.getCurrentPhoto(currentPhotos);
    return currentPhoto && parsePhotoSegmentTimestamp(currentPhoto);
  }

  getIndexTime = (index = this.props.index) => {
    return moment(this.props.currentDate).tz(this.props.timezone).startOf('day').add(10*index, 's').utc();
  }

  getCurrentKey = (index = this.props.index) => {
    let timestamp = this.getIndexTime(index).format("YYYY-MM-DD-HH-mm-ss");
    return `${this.props.currentCamera === 'video' ? 'video_' : 'still_'}${timestamp}${this.props.currentCamera === 'overlays' ? '_rendered' : ''}${this.props.currentCamera === 'video' ? '.mp4' : (this.props.currentCamera === 'overlays' ? '.png' : '.jpg')}`;
  }

  checkForCurrentPhoto = (index = this.props.index) => {
    if (this.props.currentLocation && this.props.currentCamera && this.props.currentDate && this.props.currentVantagePoint) {
      return _.get(this.props.cameraData, ['cameraData', this.getIndexTime(index).format("YYYY-MM-DD-HH-mm-ss"), `${this.props.currentVantagePoint}-${this.props.currentCamera}`], '');
    }
  }

  getCurrentPhoto = (index = this.props.index) => {
    if (this.props.currentLocation && this.props.currentCamera && this.props.currentDate && this.props.currentVantagePoint) {
      return `${this.props.currentLocation}/${this.props.currentCamera === 'video' ? 'camera' : this.props.currentCamera}/${this.props.currentDate}/${this.props.currentVantagePoint}/${this.getCurrentKey(index)}`;
    }
    return '';
  }

  moveCarousel = (event) => {
    event.preventDefault();
    let index = this.props.index;
    let delta = (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 10 : 1);
    index += delta;
    this.updateQueryParam({index});
  }

  componentDidMount() {
    this.props.fetchCameraData();
    let params = QueryParams.decode(location.search.slice(1));

    if (params.currentLocation && params.currentDate){
      this.props.handleDateChange(params.currentLocation, params.currentCamera || 'camera', params.currentDate, params.currentVantagePoint);
      if (params.showLocations === 'true') {
        setTimeout(locations, 2000);
      }
    } else {
      history.push({
        search: QueryParams.encode({})
      });
      
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
    
    let currentTime = this.getIndexTime().toDate();
    if (nextState.currentDate && currentTime && this.props.classroomId && this.props.showLocations) {
      this.props.fetchSensorLocations(currentTime, this.props.classroomId);
    }
    if (!_.isEqual(nextProps.index, this.props.index)) {
      if (this.props.showLocations) {
        this.props.showLocationsAt(currentTime);
        let nextSensorLocations = _.get(nextProps, 'sensorLocations');
        this.updateLocations(nextSensorLocations);
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    let nextLocs = _.get(nextProps, 'sensorLocations.obs');
    let prevLocs = _.get(this.props, 'sensorLocations.obs');
    let nextSensorLocations = _.get(nextProps, 'sensorLocations');
    if (((!_.isEqual(nextLocs, prevLocs) && !_.isEmpty(nextLocs)) || !_.isEqual(this.props.zoom, nextProps.zoom)) && this.props.showLocations) {
      this.updateLocations(nextSensorLocations);
    }
    if (nextProps.live) {
      this.updateQueryParam({index: nextProps.index});
    }
  }

  handleControlsChanged = (nextSettings) => {
    if (this.props.live !== nextSettings.live) {
      if (!nextSettings.live) {
        nextSettings.index = (_.size(this.props.currentPhotos)-1);
      }
      this.props.toggleLiveMode();
    }
    if (this.props.showLocations !== nextSettings.showLocations) {
      this.props.toggleShowLocations();
      if (nextSettings.showLocations) {
        this.props.fetchSensorLocations(this.getIndexTime().toDate(), this.props.classroomId);
        setTimeout(locations, 1000);
      }
    }
    this.props.fetchPhotos(nextSettings.currentLocation, nextSettings.currentCamera, nextSettings.currentDate, nextSettings.currentVantagePoint)
    this.updateQueryParam(nextSettings);
  }


  handleSliderChange = _.throttle((index) => {
    console.log("slider changed index to: ", index);
    this.props.live && this.props.toggleLiveMode(false);
    this.updateQueryParam({index});
    this.props.setIndex(index);
  }, 1000)

  handleScatterClick = (data) => {
    let index = data.index+18;
    this.props.live && this.props.toggleLiveMode(false);
    this.updateQueryParam({index});
    this.props.setIndex(index);
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

    let key = this.getCurrentPhoto();
    let s3Url = `${baseUrl()}/api/v1/camera_data/signed_url/${key}`;
    let photo = key ? (
      <div className="row live-photo-wrapper">
        <div className="col-md-12">
          { this.props.currentCamera === 'video' ? <video controls autoPlay key={key} className="live-photo"><source src={s3Url} type="video/mp4"/></video> : <img src={s3Url} className="live-photo" /> }
          <h3>{moment(parsePhotoSegmentTimestamp(key)).tz(this.props.timezone).format("h:mm:ss A z")}</h3>
        </div>
      </div>
    ) : '';

    let slider = (
      <div className="row">
        <div className="col-md-12">
          <input
            id="zoom-slider"
            type="range"
            value={this.props.index}
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
            <div className={this.state.showSegmentBuilder || this.props.showLocations ? `col-xs-12 col-sm-6 col-lg-8` : `col-xs-12`}>
              {scatterMap}
              {slider}
              {this.props.authenticated && !_.isEmpty(this.props.currentPhotos) ? photo : this.props.fetchPhotosStatus === 'fetching' ? <Spinner className="spinner" useLayout="true" /> : 'No cameras found'}
            </div>
            { this.state.showSegmentBuilder || this.props.showLocations ? (
              <div className="col-xs-12 col-sm-6 col-lg-4">
                {this.props.showLocations ? locationsViz : ''}
                <div className="row">
                  <div className="col">
                    {this.props.currentLocation && this.state.showSegmentBuilder ? <ProximitySegmentsEditor segments={this.props.segments} getCurrentTime={this.getCurrentTime.bind(this)} currentLocation={this.props.currentLocation} onSave={this.props.saveCameraSegment} /> : ''}
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
