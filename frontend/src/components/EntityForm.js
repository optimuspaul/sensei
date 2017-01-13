import React from 'react';
import _ from 'lodash';

class EntityForm extends React.Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleChange = this.handleChange.bind(this);
    let entity = props.entity || {};
    this.state = {
      entity,
      saveDisabled: _.isEmpty(entity.name)
    }
  }

  handleChange(event) {
    let entity = _.merge(this.state.entity, {name: event.target.value})
    this.setState({
      entity,
      saveDisabled: _.isEmpty(entity.name)
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.onSave(this.props.entityType, this.state.entity);
  }

  handleCancel(event) {
    event.preventDefault();
    this.props.onCancel();
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  render() {


    return (
      <form className="form-inline"
            onSubmit={this.handleSubmit}
            key={`new-${this.props.entityType}`}
      >
        <div className="form-group">
          <input type="text"
                 placeholder="Name"
                 className="form-control"
                 style={{height: "22px", marginTop: "-7px"}}
                 defaultValue={this.state.entity.name}
                 onChange={this.handleChange}
          />
        </div>
        <input type="submit"
               className="btn btn-primary pull-right btn-xs"
               onClick={this.handleSubmit}
               value="save"
        />
        <button className="btn btn-default pull-right btn-xs"
                style={{marginRight: "5px"}}
                onClick={this.handleCancel}
        > cancel </button>
      </form>
    );
  }
}

export default EntityForm;
