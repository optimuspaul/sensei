import React from 'react';
import _ from 'lodash';
import EntityEntry from './EntityEntry';
import EntityForm from './EntityForm';

class ManageEntitiesInterface extends React.Component {

  constructor(props) {
    super(props);
    this.showEntityForm = this.showEntityForm.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleUpdate = this.handleUpdate.bind(this);
    this.state = {
      showingForm: false
    }
  }

  handleSave(entityType, entity) {
    this.props.dispatch(this.props.saveEntity(entityType, entity));
    this.setState({showingForm: false});
  }

  handleCancel() {
    this.setState({showingForm: false});
  }

  handleUpdate(entityType, entity) {
    this.props.dispatch(this.props.updateEntity(entityType, entity));
  }

  showEntityForm(entityType) {
    this.setState({showingForm: entityType})
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  render() {


    let entityTypes = _.map(['areas', 'materials'], (entityType) => {
      return (
        <div className="col-md-6" key={`manage-${entityType}`}>
          <h2>{entityType}
            { this.state.showingForm !== entityType ? <small><a href="#" onClick={() => { this.showEntityForm(entityType)} }> add new..</a></small> : "" }
          </h2>

          { this.state.showingForm === entityType ? <div style={{margin: "20px 0px"}}><EntityForm requests={this.props.requests} entityType={entityType} onCancel={this.handleCancel} onSave={this.handleSave}/></div> : "" }

          <ul className="list-group">
            {
              _.map(this.props.entities[entityType], (entity) => {
                return (<EntityEntry key={`${entityType}-${entity.id}`} requests={this.props.requests} entity={entity} entityType={entityType} onUpdate={this.handleUpdate}/>);
              })
            }
          </ul>
        </div>
      )
    });

    return (
      <div className="row">
        <div className="col-md-8">
          <div className="row">
            {entityTypes}
          </div>
        </div>
      </div>
    )
  }
}

export default ManageEntitiesInterface;
