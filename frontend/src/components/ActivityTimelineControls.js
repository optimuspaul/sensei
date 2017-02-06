import React from 'react';
import _ from 'lodash';
import DatePicker from 'react-bootstrap-date-picker';

class ActivityTimelineControls extends React.Component {

  constructor(props) {
    super(props);
    this.handleChildSelect = this.handleChildSelect.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);
    let date = new Date();
    date.setDate(date.getDate() - 1);
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

  handleChildSelect(event) {
    if (event.target.value) {
      this.childId = event.target.value;
      this.props.dispatch(this.props.selectChild(this.childId));
    }
  }

  render() {

    let children = _.map(this.props.entities.children, (child) => {
      return (
        <option key={`child-${child.id}`} value={child.id}>{child.displayName }</option>
      )
    })

    return (
      <div>
        <div className="row">
          <div className="col-md-12">
            <form>
              <div className="form-group">
                <label>Student</label>
                <select className="form-control" name="select-child" onChange={this.handleChildSelect}>
                  <option value="">Select Child..</option>
                  {children}
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
