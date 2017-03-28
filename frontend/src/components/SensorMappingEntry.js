import React from 'react';
import _ from 'lodash';

class SensorMappingEntry extends React.Component {
  constructor(props) {
    super(props);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.entityId = this.props.mapping.entityId;
    this.entityType = this.props.mapping.entityType;
  }

  handleBlur(event) {
    let sensorId = event.target.value;
    if (_.isInteger(parseInt(sensorId, 10)) || sensorId === "") {
      if (sensorId === "") {
        this.props.mapping.entityId = null;
        this.props.mapping.entityType = null;
        sensorId = this.tmpSensorId;
        delete this.tmpSensorId;
      } else {
        sensorId = parseInt(sensorId, 10);
        this.props.mapping.entityId = this.entityId;
        this.props.mapping.entityType = this.entityType;
      }
      // if (sensorId !== this.props.mapping.sensorId) {
        this.props.onUpdate(_.merge(this.props.mapping, {sensorId}))
      // }
    } else {
      event.target.value = null;
    }
  }

  handleFocus(event) {
    this.tmpSensorId = parseInt(event.target.value, 10);
  }

  handleKeyPress(event) {
    if (event.key === 'Enter' || (event.key === 'Backspace' && event.target.value === "")) {
      this.handleBlur(event);
    }
  }

  render() {

    return (
      <tr className="sensor-mapping-entry">
        <td>{this.props.label}</td>
        <td>
          <input type="text"
                 style={{width: 50}}
                 className="pull-right"
                 key={`sensorId-${this.props.mapping.sensorId}`}
                 defaultValue={this.props.mapping.sensorId}
                 onBlur={this.handleBlur}
                 onKeyUp={this.handleKeyPress}
                 onFocus={this.handleFocus}
          />
        </td>
      </tr>
    );
  }
}

export default SensorMappingEntry;
