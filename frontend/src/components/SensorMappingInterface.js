import React from 'react';
import SensorMappingEntry from './SensorMappingEntry';
import _ from 'lodash';

class SensorMappingInterface extends React.Component {

  constructor(props) {
    super(props);
    this.handleMappingChange = this.handleMappingChange.bind(this);
    this.handleSave = this.handleSave.bind(this);
  }

  handleMappingChange(mapping) {

    this.props.dispatch(this.props.saveMapping(mapping));
  }

  handleSave() {
    this.props.dispatch(this.props.commitMappings());
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  render() {

    const entityTables = _.map(['student', 'teacher', 'material', 'area'], (entityType) => {
      const rows = _.map(this.props.entities[`${entityType}s`], (entity) => {
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
            <div className="col-md-6">
              <button className="btn btn-primary" onClick={this.handleSave}>Save</button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default SensorMappingInterface;
