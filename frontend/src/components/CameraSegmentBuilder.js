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
import { history } from '../utils';

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
      showLocations: params.locations === 'hide' ? false : true,
      segments: true
    }
  }

  updateQueryParam(paramObj = {}) {
    let params = QueryParams.decode(location.search.slice(1)) || {};
    history.push({
      search: QueryParams.encode(_.merge(params, paramObj))
    });
  }

  getLocations(cameraData = this.props.cameraData) {
    return _.keys(cameraData.locations);
  }


  getTimezone(cameraData = this.props.cameraData) {
    return _.get(this.props.cameraData, `locations.${this.state.currentLocation}.classroom_info.timezone`, '');
  }

  getClassroomId(cameraData = this.props.cameraData) {
    return _.get(this.props.cameraData, `locations.${this.state.currentLocation}.classroom_info.classroom_id`, []);
  }


  getCurrentTime(photoUrl, cameraData = this.props.cameraData) {
    let currentPhoto = photoUrl || this.getCurrentPhoto(cameraData);
    if (currentPhoto) {
      let key = currentPhoto.split('/')[4]
      let keyTime = key.match(/[0-9]{4}(.*(?=_)|.*(?=\.))/)[0];
      let timestamp = new Date(`${keyTime.split('-').splice(0,3).join('-')} ${keyTime.split('-').splice(3,3).join(':')}`);
      return timestamp;
    }

  }

  getPhotos(index=0, cameraData = this.props.cameraData) {
    return _.reduce(cameraData.cameras, (current, camera) => {
      if (!_.isEmpty(cameraData.currentPhotos)) {
        current[camera] = cameraData.currentPhotos.slice(index,index+50)
      }
      return current;
    }, {})
  }

  getCurrentPhoto(cameraData = this.props.cameraData) {
    return _.get(cameraData, `locations.${this.state.currentLocation}.${this.state.currentCamera}.${this.state.currentDate}.${this.state.index}`);
  }


  handleCarouselChange = (delta, carouselIndex, photo) => {
    let currentIndex = this.state.index;
    let page = this.state.page;
    if (page < 0) return false;
    let newIndex = currentIndex + delta;
    let pageForward = delta > 0 && _.size(this.props.currentPhotos) > (newIndex+15) && carouselIndex > 35;
    let pageBack = delta < 0 && 0 < (newIndex-15) && carouselIndex <= 15;
    if ((pageForward || pageBack) && this.state.index > 35) {
      let photos;
      let newIndexModified;
        if (pageBack) {
          page--
          newIndexModified = newIndex - 49 + 15;
        } else {
          newIndexModified = newIndex - 15;
          page++;
        }
        photos = this.getPhotos(newIndexModified);
      // }
      this.setState({
        photos,
        index: newIndex,
        page
      })
      this.updateQueryParam({index: newIndex});
      return pageForward ? 'forward' : 'back';
    } else {
      this.setState({
        index: newIndex
      });
      this.updateQueryParam({index: newIndex});
      return false;
    }
    
  }

  handleLocationChange = (event) => {
    this.props.fetchPhotos(event.target.value);
    this.setState({currentLocation: event.target.value, index: 0, page: 0, photos: [], currentVantagePoint: '', currentCamera: 'camera', currentDate: ''});
    this.updateQueryParam({currentLocation: event.target.value, index:0, currentVantagePoint: null, currentCamera: 'camera', currentDate: null });
  }

  handleCameraChange = (event) => {
    this.setState({currentCamera: event.target.value});
    this.updateQueryParam({currentCamera: event.target.value})
  }

  handleVantagePointChange = (event) => {
    this.setState({currentVantagePoint: event.target.value});
    this.updateQueryParam({currentVantagePoint: event.target.value})
  }

  handleDateChange = (event) => {
    this.props.handleDateChange(this.state.currentLocation, this.state.currentCamera, event.target.value);
    this.setState({currentDate: event.target.value, index: 0, page: 0, photos: [], currentVantagePoint: ''});
    this.updateQueryParam({currentDate: event.target.value, index: 0, currentVantagePoint: null, currentCamera: null});
  }

  handleEmailChange = (event) => {
    this.setState({email: event.target.value})
  }

  handlePasswordChange = (event) => {
    this.setState({password: event.target.value})
  }

  handleAuthSubmit = (event) => {
    event.preventDefault();
    this.setState({authenticating: true})
    this.props.authenticate(this.state.email, this.state.password);
  }

  refreshPhotos() {
    this.props.fetchPhotos(this.state.currentLocation, this.state.currentCamera, this.state.currentDate);
  }

  componentDidMount() {
    let params = QueryParams.decode(location.search.slice(1));

    if (params.currentLocation && params.currentDate){
      this.props.handleDateChange(params.currentLocation, params.currentCamera || 'camera', params.currentDate);
      this.setState(_.omit(params));
    } else {
      history.push({
        search: QueryParams.encode({})
      });
      this.props.fetchPhotos();
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
    if (!_.isEmpty(nextProps.currentPhotos) && _.isEmpty(this.props.currentPhotos)) {
      if (this.state.showLocations) {
        this.props.fetchSensorLocations(this.getCurrentTime(nextProps.currentPhotos[0]), _.get(nextProps.cameraData.locations, `${this.state.currentLocation}.classroom_info.classroom_id`));
      }

      let params = QueryParams.decode(location.search.slice(1));
      let index = !_.isEmpty(params.index) ? parseInt(params.index) : 0;
      let page = parseInt(index/50);
      let photos = this.getPhotos(page > 0 ? index-15 : 0, nextProps.cameraData);

      let currentVantagePoint = this.state.currentVantagePoint || nextProps.vantagePoints[0] || '';
      let currentCamera = this.state.currentCamera || nextProps.currentCamera || 'camera';

      this.setState({ photos, max: _.size(nextProps.currentPhotos), authenticating: nextProps.authenticating, index, page, currentVantagePoint});
    }

  }



  switchCamera = (kind) => {
    let newState = {currentCamera: this.state.currentCamera !== kind ? kind : 'camera'};
    this.setState(newState);
    this.updateQueryParam(newState);
  }

  toggleSegmentBuilder = () => {
    this.setState({showSegmentBuilder: !this.state.showSegmentBuilder})
  }


  switchVantagePoint = (event) => {
    event.preventDefault();
    let currentVantagePointIndex = vantagePoints.indexOf(this.state.currentVantagePoint);
    let newState = {};
    if (event.key === 'ArrowDown' && currentVantagePointIndex > 0) {
      newState = {currentVantagePoint: this.props.cameraData.vantagePoints[currentVantagePointIndex-1]};
    }
    if (event.key === 'ArrowUp' && currentVantagePointIndex < (_.size(vantagePoints)-1)) {
      newState = {currentVantagePoint: this.props.cameraData.vantagePoints[currentVantagePointIndex+1]};
    }
    this.setState(newState);
    this.updateQueryParam(newState);
  }

  toggleLocationsViz = (event) => {
    let showLocations;
    if (this.state.showLocations === true) {
      showLocations = false;
      this.setState({showLocations});
    } else {
      showLocations = true;
      this.props.fetchSensorLocations(this.getCurrentTime(this.props.currentPhotos[0]), this.getClassroomId());
      this.setState({showLocations: true});
      setTimeout(locations, 1000);
    }
    this.updateQueryParam({locations: showLocations ? 'show' : 'hide'});
  }

  handleSliderChange = (event) => {
    let index = parseInt(event.target.value);
    let page = parseInt(index/50)
    this.updateQueryParam({index});
    let carouselIndex = page === this.state.page ? this.state.carouselIndex : 15
    this.setState({index, carouselIndex, page, photos: this.getPhotos(index-15)});
  }

  render() {

    let overlaysToggle = (
      <FormGroup>
        <Button onClick={(e) => { e.preventDefault(); this.switchCamera('overlays')}} bsStyle={this.state.currentCamera === 'overlays' ? 'success' : 'default' } active={this.state.currentCamera === 'overlays'}>Overlay</Button>
      </FormGroup>
    )

    let videoToggle = (
      <FormGroup>
        <Button onClick={(e) => { e.preventDefault(); this.switchCamera('video')}} bsStyle={this.state.currentCamera === 'video' ? 'success' : 'default' } active={this.state.currentCamera === 'video'}>Video</Button>
      </FormGroup>
    )

    let segmentBuilderToggle = (
      <FormGroup>
        <Button onClick={(e) => { e.preventDefault(); this.toggleSegmentBuilder()}} bsStyle={this.state.showSegmentBuilder ? 'success' : 'default' } active={this.state.showSegmentBuilder}>Segments</Button>
      </FormGroup>
    )

    let keyboardShortcuts = (
      <Tooltip placement="bottom">
        <table style={{textAlign: 'left'}}>
          <tr><td>l</td><td>&nbsp; toggle locations viz</td></tr>
          <tr><td>o</td><td>&nbsp; show pose overlays</td></tr>
          <tr><td>p</td><td>&nbsp; show pictures</td></tr>
          <tr><td>v</td><td>&nbsp; show videos</td></tr>
          <tr><td>↑ & ↓</td><td>&nbsp; switch between camera</td></tr>
          <tr><td>→</td><td>&nbsp; advance 1 frame</td></tr>
          <tr><td>←</td><td>&nbsp; back 1 frame</td></tr>
          <tr><td>&#8679; →</td><td>&nbsp; advance 10 frames</td></tr>
          <tr><td>&#8679; ←</td><td>&nbsp; back 10 frames</td></tr>
        </table>
      </Tooltip>
    )

    let selectors = (
      <form className="navbar-form navbar-left" role="search">
        <FormGroup controlId="formControlsSelect">
          <FormControl onChange={this.handleLocationChange} value={this.state.currentLocation} componentClass="select">
            <option value="select">select a classroom</option>
            {_.map(this.getLocations(), (location) => { return <option key={location} value={location}>{location}</option> } ) }
          </FormControl>
        </FormGroup>
        <FormGroup controlId="formControlsSelect">
          <FormControl onChange={this.handleDateChange} value={this.state.currentDate} componentClass="select">
            <option value="select">select a date</option>
            {_.map(this.props.dates, (date) => { return <option key={date} value={date}>{date}</option> } ) }
          </FormControl>
        </FormGroup>
        <FormGroup controlId="formControlsSelect">
          <FormControl onChange={this.handleCameraChange} value={this.state.currentCamera} componentClass="select">
            <option value="select">select a mode</option>
            {_.map(this.props.cameraData.cameras, (camera) => { return <option key={camera} value={camera}>{camera}</option> } ) }
          </FormControl>
        </FormGroup>
        <FormGroup controlId="formControlsSelect">
          <FormControl onChange={this.handleVantagePointChange} value={this.state.currentVantagePoint} componentClass="select">
            <option value="select">select a camera</option>
            {_.map(this.props.cameraData.vantagePoints, (vantagePoint) => { return <option key={vantagePoint} value={vantagePoint}>{vantagePoint.replace("0", " ")}</option> } ) }
          </FormControl>
        </FormGroup>
{/*        {_.includes(this.props.cameraData.cameras, 'overlays') ? overlaysToggle : ''}
        {_.includes(this.props.cameraData.cameras, 'video') ? videoToggle : ''}*/}
        { segmentBuilderToggle }
        <OverlayTrigger placement="bottom" overlay={keyboardShortcuts}>
          <Badge>⌘ shortcuts</Badge>
        </OverlayTrigger>
      </form>
    )

    let authForm = (
      <form onSubmit={this.handleAuthSubmit} className="navbar-form navbar-left" role="search">

        <FormGroup validationState={this.props.authFailed ? 'error' : null}>

          <FormControl
            id="formControlsEmail"
            type="email"
            label="TC Email"
            placeholder="tc email"
            name="email"
            autoComplete="username"
            onChange={this.handleEmailChange}
          />
          <FormControl 
            id="formControlsPassword" 
            label="Password" 
            type="password" 
            autoComplete="password"
            placeholder="tc password"
            name="password"
            onChange={this.handlePasswordChange}
          />
        <Button onClick={this.handleAuthSubmit} type="submit" disabled={this.props.authenticating}>{this.props.authenticating ? 'submitting...' : 'Submit'}</Button>
        </FormGroup>
        { this.props.authFailed ? <FormGroup validationState={this.props.authFailed ? 'error' : null}><HelpBlock>wrong credentials</HelpBlock></FormGroup> : ''}
        
      </form>
    )


    let imageBrowser = (
      <div>
        <div className="row">
          <div className="col-md-12">
            <input
              id="zoom-slider"
              type="range"
              value={this.state.index}
              min="0"
              max={this.state.max}
              step="1"
              onChange={_.throttle(this.handleSliderChange).bind(this)}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <div className="photo-viewer">
              <CameraSegmentBuilderCarousel timezone={this.getTimezone()} vantagePoints={this.props.cameraData.vantagePoints} index={this.state.carouselIndex} page={this.state.page} photos={this.state.photos} camera={this.state.currentCamera} vantagePoint={this.state.currentVantagePoint} onCarouselChange={this.handleCarouselChange} />
            </div>
          </div>
        </div>
      </div>
    )

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


    return (
      <div>
        <KeyHandler keyEventName={KEYDOWN} keyValue="ArrowUp" onKeyHandle={this.switchVantagePoint} />
        <KeyHandler keyEventName={KEYDOWN} keyValue="ArrowDown" onKeyHandle={this.switchVantagePoint} />
        <KeyHandler keyEventName={KEYDOWN} keyValue="o" onKeyHandle={(e) => {e.preventDefault(); this.switchCamera('overlays')}} />
        <KeyHandler keyEventName={KEYDOWN} keyValue="v" onKeyHandle={(e) => {e.preventDefault(); this.switchCamera('video')}} />
        <KeyHandler keyEventName={KEYDOWN} keyValue="p" onKeyHandle={(e) => {e.preventDefault(); this.switchCamera('camera')}} />
        <KeyHandler keyEventName={KEYDOWN} keyValue="l" onKeyHandle={this.toggleLocationsViz} />
        <KeyHandler keyEventName={KEYDOWN} keyValue="s" onKeyHandle={this.toggleSegmentBuilder} />
        <nav className="navbar navbar-default">
          <div className="container-fluid">
            <div className="navbar-header">
              <a className="navbar-brand" href="/">Wildflower Schools Camera Viewer</a>
            </div>
            {this.props.authenticated ? selectors : authForm}
            <ul id="logout-actions" className={`nav navbar-nav navbar-right ${this.props.authenticated ? '' : 'hidden'}`}>
              <li><a id="logout" onClick={this.props.deauthenticate} href="#">Sign out</a></li>
            </ul>
          </div>
        </nav>
        <div className="photo-container container-fluid">
          <div className="row">
            <div className={this.state.showSegmentBuilder || this.state.showLocations ? `col-xs-12 col-sm-6 col-lg-8` : `col-xs-12`}>
              {this.props.authenticated && !_.isEmpty(this.props.currentPhotos) ? imageBrowser : this.props.fetchPhotosStatus === 'fetching' ? <Spinner className="spinner" useLayout="true" /> : 'No cameras found'}
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
