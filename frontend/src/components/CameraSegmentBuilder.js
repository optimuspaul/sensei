import React from 'react';
import _ from 'lodash';
import * as d3 from "d3";
import './CameraSegmentBuilder.css';
import { Carousel, FormGroup, FormControl } from 'react-bootstrap';
import {getSenseiToken,  baseUrl, vantagePoints} from './../constants';
import CameraSegmentBuilderCarousel from './CameraSegmentBuilderCarousel';
import KeyHandler, {KEYDOWN} from 'react-key-handler';
import ProximitySegmentsEditor from './ProximitySegmentsEditor';

class CameraSegmentBuilder extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      currentLocation: '',
      currentCamera: '',
      currentVantagePoint: '',
      currentDate: '',
      index: 0,
      page: 0,
      photos: {

      }
    }
  }

  getLocations() {
    return _.keys(this.props.cameraData.locations);
  }

  getCameras() {
    return _.keys(_.get(this.props.cameraData.locations, this.state.currentLocation, []));
  }

  getDates() {
    return _.keys(_.get(this.props.cameraData.locations, `${this.state.currentLocation}.${this.state.currentCamera}`, []));
  }

  getCurrentTime() {
    let currentPhoto = this.getCurrentPhoto();
    if (currentPhoto) {
      let key = currentPhoto.split('/')[4]
      let keyTime = key.match(/[0-9]{4}(.*(?=_)|.*(?=\.))/)[0];
      let timestamp = new Date(`${keyTime.split('-').splice(0,3).join('-')} ${keyTime.split('-').splice(3,3).join(':')}`);
      return timestamp;
    }

  }

  getPhotos(index=0) {
    return _.reduce(this.getCameras(), (current, camera) => {
      let photos = _.get(this.props.cameraData.locations, `${this.state.currentLocation}.${camera}.${this.state.currentDate}`, []);
      current[camera] = photos.slice(index,index+50)
      return current;
    }, {})
  }

  getCurrentPhoto() {
    return _.get(this.state, `photos.${this.state.currentCamera}.${this.state.index}`);
  }

  getAllPhotos() {
    return  _.get(this.props.cameraData.locations, `${this.state.currentLocation}.${this.state.currentCamera}.${this.state.currentDate}`, []);
  }

  handleCarouselChange = (delta, carouselIndex) => {
    let currentIndex = this.state.index;
    let page = this.state.page;
    if (page < 0) return false;
    let newIndex = currentIndex + delta;
    let pageForward = delta > 0 && _.size(this.getAllPhotos()) > (newIndex+15) && carouselIndex > 35;
    let pageBack = delta < 0 && 0 < (newIndex-15) && carouselIndex <= 15;
    if (pageForward || pageBack) {
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
      return pageForward ? 'forward' : 'back';
    } else {
      this.setState({
        index: newIndex
      });
      return false;
    }
  }

  handleLocationChange = (event) => {
    this.props.fetchPhotos(event.target.value, this.state.currentCamera, this.state.currentDate);
    this.setState({currentLocation: event.target.value});
  }

  handleCameraChange = (event) => {
    this.setState({currentCamera: event.target.value});
  }

  handleVantagePointChange = (event) => {
    this.setState({currentVantagePoint: event.target.value});
  }

  handleDateChange = (event) => {
    this.props.fetchPhotos(this.state.currentLocation, this.state.currentCamera, event.target.value);
    this.props.fetchCameraSegments(this.state.currentLocation, event.target.value);
    this.setState({currentDate: event.target.value});
  }

  refreshPhotos() {
    this.props.fetchPhotos(this.state.currentLocation, this.state.currentCamera, this.state.currentDate);
  }

  componentDidMount() {
    this.refreshPhotos();
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ photos: this.getPhotos() });
  }

  switchCamera = (event) => {
    event.preventDefault();
    let cameras = this.getCameras();
    let currentCameraIndex = cameras.indexOf(this.state.currentCamera);

    let currentVantagePointIndex = vantagePoints.indexOf(this.state.currentVantagePoint);
    if (event.key === 'ArrowDown' && event.shiftKey && currentCameraIndex > 0) {
      this.setState({currentCamera: cameras[currentCameraIndex-1] });
    }
    if (event.key === 'ArrowUp' && event.shiftKey && currentCameraIndex < (_.size(cameras)-1)) {
      this.setState({currentCamera: cameras[currentCameraIndex+1] });
    }
    if (event.key === 'ArrowDown' && !event.shiftKey && currentVantagePointIndex > 0) {
      this.setState({currentVantagePoint: vantagePoints[currentVantagePointIndex-1] });
    }
    if (event.key === 'ArrowUp' && !event.shiftKey && currentVantagePointIndex < (_.size(vantagePoints)-1)) {
      this.setState({currentVantagePoint: vantagePoints[currentVantagePointIndex+1] });
    }
  }

  render() {



    return (
      <div>
        <KeyHandler keyEventName={KEYDOWN} keyValue="ArrowUp" onKeyHandle={this.switchCamera} />
        <KeyHandler keyEventName={KEYDOWN} keyValue="ArrowDown" onKeyHandle={this.switchCamera} />
        <nav className="navbar navbar-default">
          <div className="container-fluid">
            <div className="navbar-header">
              <a className="navbar-brand" href="/">Wildflower Schools: Camera Segment Builder</a>
            </div>
            <form className="navbar-form navbar-left" role="search">
              <FormGroup controlId="formControlsSelect">
                <FormControl onChange={this.handleLocationChange} value={this.state.currentLocation} componentClass="select">
                  <option value="select">select a classroom</option>
                  {_.map(this.getLocations(), (location) => { return <option key={location} value={location}>{location}</option> } ) }
                </FormControl>
              </FormGroup>
              <FormGroup controlId="formControlsSelect">
                <FormControl onChange={this.handleCameraChange} value={this.state.currentCamera} componentClass="select">
                  <option value="select">select a mode</option>
                  {_.map(this.getCameras(), (camera) => { return <option key={camera} value={camera}>{camera}</option> } ) }
                </FormControl>
              </FormGroup>
              <FormGroup controlId="formControlsSelect">
                <FormControl onChange={this.handleVantagePointChange} value={this.state.currentVantagePoint} componentClass="select">
                  <option value="select">select a camera</option>
                  {_.map(vantagePoints, (vantagePoint) => { return <option key={vantagePoint} value={vantagePoint}>{vantagePoint.replace("0", " ")}</option> } ) }
                </FormControl>
              </FormGroup>
              <FormGroup controlId="formControlsSelect">
                <FormControl onChange={this.handleDateChange} value={this.state.currentDate} componentClass="select">
                  <option value="select">select a date</option>
                  {_.map(this.getDates(), (date) => { return <option key={date} value={date}>{date}</option> } ) }
                </FormControl>
              </FormGroup>
            </form>
            <ul id="logout-actions" className="hidden nav navbar-nav navbar-right">
              <li><a id="logout" href="#">Sign out</a></li>
            </ul>
          </div>
        </nav>
        <div className="photo-container container-fluid">
          <div className="row">
            <div className="col-xs-12 col-sm-6 col-lg-8">
              <div className="photo-viewer">
                <CameraSegmentBuilderCarousel page={this.state.page} photos={this.state.photos} camera={this.state.currentCamera} vantagePoint={this.state.currentVantagePoint} onCarouselChange={this.handleCarouselChange} />
              </div>
            </div>
            <div className="col-xs-12 col-sm-6 col-lg-4">
              <ProximitySegmentsEditor segments={this.props.segments} getCurrentTime={this.getCurrentTime.bind(this)} currentLocation={this.state.currentLocation} onSave={this.props.saveCameraSegment} />
            </div>
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
