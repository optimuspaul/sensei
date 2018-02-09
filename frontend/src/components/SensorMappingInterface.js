import React from 'react';
import SensorMappingEntry from './SensorMappingEntry';
import {entityInflections} from './../constants';
import _ from 'lodash';

class SensorMappingInterface extends React.Component {

  constructor(props) {
    super(props);
    this.handleMappingChange = this.handleMappingChange.bind(this);
    this.handleSave = this.handleSave.bind(this);

    this.state = {
      saveDisabled: true
    }
  }

  componentWillMount() {
    window.onbeforeunload = () => !this.state.saveDisabled
  }

  componentWillUnmount() {
    window.onbeforeunload = null;
  }

  handleMappingChange(mapping) {
    this.props.dispatch(this.props.saveMapping(mapping));
    this.setState({
      saveDisabled: false,
      success: null,
      error: null
    });
  }

  handleSave() {
    this.requestId = _.uniqueId('mappings-save-');
    this.props.dispatch(this.props.commitMappings(this.requestId));
    this.setState({
      saveDisabled: true,
      success: null,
      error: null
    });
  }

  componentWillReceiveProps(nextProps) {
    if (_.get(nextProps, `requests[${this.requestId}].status`) === 'success') {
      delete this.requestId;
      this.setState({
        saveDisabled: false,
        success: "Mappings saved successfully",
        error: null
      });
    }
    if (_.get(nextProps, `requests[${this.requestId}].status`) === 'error') {
      let error = _.get(nextProps, `requests[${this.requestId}].payload.message`);
      delete this.requestId;
      this.setState({
        saveDisabled: false,
        success: null,
        error
      });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  render() {

    let requestMsg;

    if (this.state.error) {
      requestMsg = (
        <div className="error">
          {this.state.error}
        </div>
      )
    } else if (this.state.success) {
      requestMsg = (
        <div className="success" style={{color: 'green'}}>
          {this.state.success}
        </div>
      )
    }

    const entityTables = _.map(['child', 'teacher', 'material', 'area'], (entityType) => {
      var pluralEntity = entityInflections[entityType]
      const rows = _.map(this.props.entities[pluralEntity], (entity) => {
        const mapping = (this.props.mappings[entityType] && this.props.mappings[entityType][entity.id]) || {
          entityId: entity.id,
          entityType,
          sensorId: null
        }
        return <SensorMappingEntry key={`${entityType}-${entity.id}`} label={entity.displayName} mapping={mapping} onUpdate={this.handleMappingChange}/>
      });
      if (!_.isEmpty(rows)) {
        return (
          <div key={entityType}>
            <table className="table">
              <thead>
                <tr>
                  <th>{entityType} name</th>
                  <th style={{textAlign: 'right'}}>sensor number</th>
                </tr>
              </thead>
              <tbody>
                {rows}
              </tbody>
            </table>
          </div>
        )
      }
    })

    return (
      <div className="row">
        <div className="col-md-8">
          <div className="row">
            <div className="col-md-6">
              {entityTables[0]}
            </div>
            <div className="col-md-6">
              {entityTables[1]}
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              {entityTables[2]}
            </div>
            <div className="col-md-6">
              {entityTables[3]}
            </div>
          </div>
          <div className="row">
            <div className="col-md-2">
              <button className="btn btn-primary" 
                      onClick={this.handleSave}
                      disabled={this.state.saveDisabled}
              >Save</button>
            </div>
            <div className="col-md-4">
              {requestMsg}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default SensorMappingInterface;
