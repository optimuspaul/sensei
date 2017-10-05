import React from 'react';
import _ from 'lodash';
import './ProximitySegmentsEditor.css';
import { FormControl, Button, Popover, OverlayTrigger } from 'react-bootstrap';
import moment from 'moment';
import {CSVLink} from 'react-csv';

class ProximitySegmentsEditor extends React.Component {

  constructor(props) {
    super(props);
    let requestId = _.uniqueId('camera-segment-');
    this.state = {
      unsavedSegments: {
        [requestId]: {
          sensor1Id: '',
          sensor2Id: '',
          startTime: '',
          endTime: ''
        }
      }
    }
  }

  componentDidMount() {

  }

  componentWillReceiveProps(nextProps) {
    if (_.isArray(nextProps.segments)) {
      _.each(nextProps.segments, (segment) => {
        if (segment.requestId && this.state.unsavedSegments[segment.requestId]) {
          delete this.state.unsavedSegments[segment.requestId];
          this.setState({
            unsavedSegments: this.state.unsavedSegments
          });
        }
      });
    }
  }

  saveSegment = (requestId) => {
    let segment = this.state.unsavedSegments[requestId];
    segment.endTime = this.props.getCurrentTime();
    segment.saving = true;
    this.props.onSave(segment, requestId);
    let unsavedSegments = this.state.unsavedSegments;
    unsavedSegments[requestId].endTime = this.props.getCurrentTime();
    segment.saving = true;
    this.setState({
      unsavedSegments
    });
  }

  startSegment = (requestId) => {
    let newRequestId = _.uniqueId('camera-segment-');
    let segment = this.state.unsavedSegments[requestId];
    segment.startTime = this.props.getCurrentTime();
    segment.location = this.props.currentLocation;
    this.setState({
      unsavedSegments: {
        [newRequestId]: {
          sensor1Id: '',
          sensor2Id: '',
          startTime: '',
          endTime: ''
        },
        [requestId]: segment,
        ...this.state.unsavedSegments
      }
    })
  }

  updateSegmentSensorId = (event, sensorIdAttribute, requestId) => {
    this.setState({
      unsavedSegments: {
        ...this.state.unsavedSegments,
        [requestId]: {
          ...this.state.unsavedSegments[requestId],
          [sensorIdAttribute]: event.target.value
        }
      }
    })
  }

  render() {

    let unsavedSegments = _.map(this.state.unsavedSegments, (segment, requestId) => {
      return ( 
        <tr key={`unsaved-segment-${requestId}`}>
          <td>
            <FormControl
              id="sensor1"
              type="text"
              placeholder="1st Sensor#"
              value={segment.sensor1Id}
              onChange={(event) => { this.updateSegmentSensorId(event, 'sensor1Id', requestId) }}
            />
          </td>
          <td>
            <FormControl
              id="sensor2"
              type="text"
              placeholder="2nd Sensor#"
              value={segment.sensor2Id}
              onChange={(event) => { this.updateSegmentSensorId(event, 'sensor2Id', requestId) }}
            />
          </td>
          <td>
            { segment.startTime ? moment(segment.startTime).format('LTS') : <Button disabled={!this.props.getCurrentTime()} onClick={() => { this.startSegment(requestId) }} bsStyle="primary">Start</Button> }
          </td>
          <td>
            { (segment.endTime && !segment.saving) ? moment(segment.endTime).format('LTS') : <Button disabled={segment.saving || !segment.sensor1Id || !segment.sensor2Id || !segment.startTime} onClick={() => { this.saveSegment(requestId) }} bsStyle="primary">{segment.saving ? 'saving..' : 'End'}</Button> }
          </td>
        </tr>
      )
    });

    let savedSegments = _.map(this.props.segments, (segment, key) => {
      return ( 
        <tr key={`saved-segment-${key}`}>
          <td>
            {segment.sensor1Id}
          </td>
          <td>
            {segment.sensor2Id}
          </td>
          <td>
            { moment(segment.startTime).format('LTS') }
          </td>
          <td>
            { moment(segment.endTime).format('LTS') }
          </td>
        </tr>
      )
    });

    let csvData = _.map(this.props.segments, (segment) => { 
      return {
        '1st Sensor': segment.sensor1Id,
        '2nd Sensor': segment.sensor2Id,
        'Start Time': moment(segment.startTime).format("M-D-YY, h:mm:ss a"),
        'End Time': moment(segment.endTime).format("M-D-YY, h:mm:ss a")
      };
    });

    let popoverHoverFocus = (
      <Popover id="popover-trigger-hover-focus" title="What Are Segments?">
        "A segment occurs when 2 sensors are within 3 feet of each other. 
        Start the segment in the first image in which they are within 3 feet 
        and stop it in the first image in which they are > 3 feet apart."
      </Popover>
    )


    return (
      <div className='proximity-segments'>
        <h3>
          Proximity Segments 
          <OverlayTrigger trigger={['hover', 'focus']} placement="bottom" overlay={popoverHoverFocus}>
            <i className="glyphicon glyphicon-question-sign"></i>
          </OverlayTrigger>
        </h3>
        <p>
          <CSVLink className="btn btn-block btn-primary export-segments" disabled={_.isEmpty(csvData)} data={csvData} >Export</CSVLink>
        </p>
        <div className="sensors-list-wrapper">
          <table className="sensors-list table table-striped">
            <thead>
              <th>1st Sensor</th>
              <th>2nd Sensor</th>
              <th>Start</th>
              <th>End</th>
            </thead>
            <tbody>
              {unsavedSegments}
              {savedSegments}
            </tbody>
          </table>
        </div>
        <h4>Instructions</h4>
        <p className="text-muted">
          Scan through the photos using the right/left arrow keys (use shift for 10 at a time). 
          When two sensors appear to be within three feet of each other enter the sensor numbers and click 
          <strong> Start</strong>. When you reach a photo where they are more than three feet apart click 
          <strong> End</strong> to record the end of that proximity segment. When you are finished click 
          <strong> Export</strong> to download the data in CSV format.
        </p>
      </div>
    )
  }

}


export default ProximitySegmentsEditor