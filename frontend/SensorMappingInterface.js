import React from 'react';
import SensorMappingEntry from './SensorMappingEntry';

var SensorMappingInterface = React.createClass({
  handleMappingChange(event) {
    //this.setState({value: event.target.value});
    console.log("Entry changed: " + event.target.value);
  }

  render() {
    const studentItems = ["student1", "student2", "student3"].map((student) =>
      <SensorMappingEntry key={student} label={student} value="1" onChange={this.handleMappingChange}/>
    );
    return (
      <div>
        <div>Students</div>
          {studentItems}
        <div>Teachers</div>
        <div>Materials</div>
        <div>Areas</div>
      </div>
    )
  }

});

export default SensorMappingInterface;
