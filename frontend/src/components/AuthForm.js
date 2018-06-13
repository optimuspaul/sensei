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

class CameraSegmentBuilder extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      email: '',
      password: ''
    }
  }


  handleEmailChange = (event) => {
    this.setState({email: event.target.value})
  }

  handlePasswordChange = (event) => {
    this.setState({password: event.target.value})
  }

  handleAuthSubmit = (event) => {
    event.preventDefault();
    this.props.onSubmit(this.state.email, this.state.password);
  }

  render() {

    return (
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
        <Button onClick={this.handleAuthSubmit} type="submit" disabled={this.props.authenticating}>{this.props.authenticating? 'submitting...' : 'Submit'}</Button>
        </FormGroup>
        { this.props.authFailed ? <FormGroup validationState={this.props.authFailed ? 'error' : null}><HelpBlock>wrong credentials</HelpBlock></FormGroup> : ''}
        
      </form>
    )

  }
}

export default CameraSegmentBuilder;
