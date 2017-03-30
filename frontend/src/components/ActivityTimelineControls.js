import React from 'react';
import _ from 'lodash';
import DatePicker from 'react-bootstrap-date-picker';

class ActivityTimelineControls extends React.Component {

  constructor(props) {
    super(props);
    this.handleEntitySelect = this.handleEntitySelect.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);
    let date = new Date();
    date = date.toISOString().split('Z')[0];

    this.state = {
      date
    }
  }

  handleDateChange (date) {
    let zeroDate = new Date((new Date(date)).toDateString());
    if (date) {
      this.setState({
        date
      });
      this.props.dispatch(this.props.selectDate(zeroDate.toISOString()));
    } else {
      this.setState({
        date: this.state.date
      });
    }
  }

  handleEntitySelect(event) {
    if (event.target.value) {
      this.entityId = event.target.value.split("-")[1];
      this.entityType = event.target.value.split("-")[0]
      this.props.dispatch(this.props.selectEntity(this.entityId, this.entityType));
    }
  }

  render() {

    let children = _.map(this.props.entities.children, (child) => {
      return (
        <option key={`child-${child.id}`} value={`child-${child.id}`}>{child.displayName }</option>
      )
    })

    let teachers = _.map(this.props.entities.teachers, (teacher) => {
      return (
        <option key={`teacher-${teacher.id}`} value={`teacher-${teacher.id}`}>{teacher.displayName }</option>
      )
    })

    let areas = _.map(this.props.entities.areas, (area) => {
      return (
        <option key={`area-${area.id}`} value={`area-${area.id}`}>{area.displayName }</option>
      )
    })

    let materials = _.map(this.props.entities.materials, (material) => {
      return (
        <option key={`material-${material.id}`} value={`material-${material.id}`}>{material.displayName }</option>
      )
    })

    let selectedUid = this.props.insights.ui.currentEntityType ? `${this.props.insights.ui.currentEntityType}-${this.props.insights.ui.currentEntityId}` : '';

    return (
      <div>
        <div className="row">
          <div className="col-md-12">
            <form>
              <div className="form-group">
                <label>Viewpoint</label>
                <select className="form-control" value={selectedUid} name="select-entity" onChange={this.handleEntitySelect}>
                  <option value="">Select viewpoint..</option>
                  <optgroup label="Children">
                    {children}
                  </optgroup>
                  <optgroup label="Teachers">
                    {teachers}
                  </optgroup>
                  <optgroup label="Areas">
                    {areas}
                  </optgroup>
                  <optgroup label="Materials">
                    {materials}
                  </optgroup>
                </select>
              </div>
            </form>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <DatePicker showClearButton={false} value={this.state.date} onChange={this.handleDateChange.bind(this)} />
          </div>
        </div>
      </div>
    )
  }
}

export default ActivityTimelineControls;
