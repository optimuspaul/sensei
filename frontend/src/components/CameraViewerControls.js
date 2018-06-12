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

class CameraViewerControls extends React.Component {

  constructor(props) {
    super(props);
  }

  getSettings(newState = {}) {
    return _.merge(_.pick(this.props, ['currentLocation', 'currentCamera', 'currentDate', 'currentVantagePoint', 'live', 'showSegmentBuilder', 'locations']), newState);
  }
  
  getLocations(cameraData = this.props.cameraData) {
    return _.keys(this.props.locations);
  }

  handleLocationChange = (event) => {
    this.props.onControlsChanged(this.getSettings({ currentLocation: event.target.value }));
  }

  handleCameraChange = (event) => {
    this.props.onControlsChanged(this.getSettings({ currentCamera: event.target.value }));
  }

  handleVantagePointChange = (event) => {
    this.props.onControlsChanged(this.getSettings({ currentVantagePoint: event.target.value }));
  }

  handleDateChange = (selectedDay, modifiers) => {
    this.props.onControlsChanged(this.getSettings({ currentDate: selectedDay.format("YYYY-MM-DD") }));
  }

  switchCamera = (kind) => {
    this.props.onControlsChanged(this.getSettings({ currentCamera: this.props.currentCamera !== kind ? kind : 'camera' }));
  }

  toggleSegmentBuilder = () => {
    this.props.onControlsChanged(this.getSettings({showSegmentBuilder: !this.props.showSegmentBuilder}));
  }

  toggleLocationsViz = () => {
    this.props.onControlsChanged(this.getSettings({showLocations: !this.props.showLocations}));
  }

  handleToggleLiveMode = () => {
    this.props.onControlsChanged(this.getSettings({live: !this.props.live}));
  }

  switchVantagePoint = (event) => {
    event.preventDefault();
    let vantagePoints = this.props.vantagePoints;
    let currentVantagePointIndex = vantagePoints.indexOf(this.props.currentVantagePoint);
    let newState = {};
    if (event.key === 'ArrowDown' && currentVantagePointIndex > 0) {
      newState = {currentVantagePoint: this.props.cameraData.vantagePoints[currentVantagePointIndex-1]};
    }
    if (event.key === 'ArrowUp' && currentVantagePointIndex < (_.size(vantagePoints)-1)) {
      newState = {currentVantagePoint: this.props.cameraData.vantagePoints[currentVantagePointIndex+1]};
    }
    this.props.onControlsChanged(this.getSettings(newState));
  }

  render() {

    let keyboardShortcuts = (
      <Tooltip placement="bottom">
        <table style={{textAlign: 'left'}}>
          <tr><td>l</td><td>&nbsp; toggle locations viz</td></tr>
          <tr><td>o</td><td>&nbsp; show pose overlays</td></tr>
          <tr><td>p</td><td>&nbsp; show pictures</td></tr>
          <tr><td>v</td><td>&nbsp; show videos</td></tr>
          <tr><td>r</td><td>&nbsp; toggle realtime mode</td></tr>
          <tr><td>↑ & ↓</td><td>&nbsp; switch between camera</td></tr>
          <tr><td>→</td><td>&nbsp; advance 1 frame</td></tr>
          <tr><td>←</td><td>&nbsp; back 1 frame</td></tr>
          <tr><td>&#8679; →</td><td>&nbsp; advance 10 frames</td></tr>
          <tr><td>&#8679; ←</td><td>&nbsp; back 10 frames</td></tr>
        </table>
      </Tooltip>
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
        <KeyHandler keyEventName={KEYDOWN} keyValue="r" onKeyHandle={this.handleToggleLiveMode} />
        <form className="navbar-form navbar-left" role="search">
          <FormGroup controlId="formControlsSelect">
            <FormControl onChange={this.handleLocationChange} value={this.props.currentLocation} componentClass="select">
              <option value="select">select a classroom</option>
              {_.map(this.getLocations(), (location) => { return <option key={location} value={location}>{location}</option> } ) }
            </FormControl>
          </FormGroup>
          <FormGroup controlId="formControlsSelect">
            <DayPickerInput
              className="form-control"
              value={this.props.currentDate}
              onDayChange={this.handleDateChange}
              dayPickerProps={{
                selectedDays: moment(this.props.currentDate)
              }}
            />
          </FormGroup>
          <FormGroup controlId="formControlsSelect">
            <FormControl onChange={this.handleCameraChange} value={this.props.currentCamera} componentClass="select">
              <option value="select">select a mode</option>
              {_.map(['camera', 'overlays', 'video'], (camera) => { return <option key={camera} value={camera}>{camera}</option> } ) }
            </FormControl>
          </FormGroup>
          <FormGroup controlId="formControlsSelect">
            <FormControl onChange={this.handleVantagePointChange} value={this.props.currentVantagePoint} componentClass="select">
              <option value="select">select a camera</option>
              {_.map(['camera01', 'camera02', 'camera03', 'camera04'], (vantagePoint) => { return <option key={vantagePoint} value={vantagePoint}>{vantagePoint.replace("0", " ")}</option> } ) }
            </FormControl>
          </FormGroup>
          <FormGroup>
            <Button onClick={this.toggleLocationsViz} bsStyle={this.props.showLocations ? 'success' : 'default' } active={this.props.showLocations}>Locations</Button>
          </FormGroup>
          <FormGroup>
            <Button onClick={this.toggleLiveMode} bsStyle={this.props.live ? 'success' : 'default' } active={this.props.live}>Live</Button>
          </FormGroup>
          <FormGroup>
            <Button onClick={this.toggleSegmentBuilder} bsStyle={this.props.showSegmentBuilder ? 'success' : 'default' } active={this.props.showSegmentBuilder}>Segments</Button>
          </FormGroup>
          <OverlayTrigger placement="bottom" overlay={keyboardShortcuts}>
            <Badge>⌘ shortcuts</Badge>
          </OverlayTrigger>
        </form>
      </div>
    )

  }
}

export default CameraViewerControls;
