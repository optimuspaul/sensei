import React from 'react';

class SensorMappingEntry extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: props.value};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(evt) {
    this.setState({value: evt.target.value});
  }

  handleSubmit(evt) {
    this.setState({value: evt.target.value});
  }

  render() {
    return (
      <div className="sensor-mapping-entry">
        <span>{this.props.label}</span>
        <input type="text" value={this.state.value} onChange={this.handleChange} />
      </div>
    );
  }
}

export default SensorMappingEntry;
