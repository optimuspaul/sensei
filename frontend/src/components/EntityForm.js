import React from 'react';
import _ from 'lodash';

class EntityForm extends React.Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleChange = this.handleChange.bind(this);
    let entity = Object.assign({}, props.entity);
    this.state = {
      entity,
      saveDisabled: _.isEmpty(entity.name),
      cancelDisabled: false
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
    this.requestId = _.uniqueId('entity-save-');
    this.props.onSave(this.props.entityType, this.state.entity, this.requestId);
    this.setState({
      saveDisabled: true,
      cancelDisabled: true
    });
  }

  handleCancel(event) {
    event.preventDefault();
    this.props.onCancel();
  }

  componentWillReceiveProps(nextProps) {
    if (_.get(nextProps, `requests[${this.requestId}].status`) === 'success') {
      delete this.requestId;
      this.setState({
        saveDisabled: false,
        cancelDisabled: false,
        error: null
      });
    }
    if (_.get(nextProps, `requests[${this.requestId}].status`) === 'error') {
      let error = _.get(nextProps, `requests[${this.requestId}].payload.message`);
      delete this.requestId;
      this.setState({
        saveDisabled: false,
        cancelDisabled: false,
        error
      });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  render() {

    let error;
    if (this.state.error) {
      error = (
        <div className="row">
          <div className="col-md-12 error">
            {this.state.error} 
            <br/>
          </div>
        </div>
      )
    }

    return (
      <div className={this.state.error ? 'error' : ''}>
        {error}
        <div className="row">
          <div className="col-md-12 error">
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
                       disabled={this.state.cancelDisabled}
                       onChange={this.handleChange}
                />
              </div>
              <input type="submit"
                     className="btn btn-primary pull-right btn-xs"
                     onClick={this.handleSubmit}
                     disabled={this.state.saveDisabled}
                     value="save"
              />
              <button className="btn btn-default pull-right btn-xs"
                      style={{marginRight: "5px"}}
                      onClick={this.handleCancel}
                      disabled={this.state.cancelDisabled}
              > cancel </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default EntityForm;
