import React from 'react';
import _ from 'lodash';
import EntityForm from './EntityForm';

class EntityEntry extends React.Component {
  constructor(props) {
    super(props);
    this.showEntityForm = this.showEntityForm.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.state = {
      showingForm: false
    }
  }

  showEntityForm() {
    this.setState({showingForm: true});
  }

  handleSave(entityType, entity, requestId) {
    this.requestId = requestId;
    this.props.onUpdate(entityType, entity, requestId);
  }

  handleCancel(entityType, entity) {
    this.setState({showingForm: false});
  }

  componentWillReceiveProps(nextProps) {
    if (_.get(nextProps, `requests[${this.requestId}].status`) === 'success') {
      delete this.requestId;
      this.setState({showingForm: false});
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  render() {

    console.log("this.state.showingForm", this.state.showingForm);

    let entry = (
      <span>
        {this.props.entity.name} <button className="pull-right btn btn-default btn-xs" onClick={this.showEntityForm}>edit</button>
      </span>
    )

    let form = (<EntityForm requests={this.props.requests} entity={this.props.entity} onSave={this.handleSave} onCancel={this.handleCancel} entityType={this.props.entityType}/>)

    return (
      <li className="list-group-item">
       {this.state.showingForm ? form : entry}
      </li>
    );
  }
}

export default EntityEntry;
