import React from 'react';
import _ from 'lodash';
import DatePicker from 'react-bootstrap-date-picker';
import QueryParams from 'query-params';
import { history } from '../utils';

class ActivityTimelineControls extends React.Component {

  constructor(props) {
    super(props);
    this.handleEntitySelect = this.handleEntitySelect.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);
    this.handleEndDateChange = this.handleEndDateChange.bind(this);
    this.handleVisualizationSelect = this.handleVisualizationSelect.bind(this);

    let params = QueryParams.decode(location.search.slice(1));

    let date = new Date((params.date ? new Date(params.date) : new Date()).toDateString());
    date = date.toISOString().split('Z')[0];

    let endDate = new Date((params.endDate ? new Date(params.endDate) : new Date()).toDateString());
    endDate = endDate.toISOString().split('Z')[0];

    this.state = {
      date,
      endDate,
      maxEndDate: (new Date()).toISOString(),
      minEndDate: (new Date()).toISOString()
    }
  }

  componentWillMount() {

    this.unlisten = history.listen((location, action) => {
      // location is an object like window.location
      let params = QueryParams.decode(location.search.slice(1));
      this.props.dispatch(this.props.refreshFromParams(params))
    })
  }

  componentWillUnmount() {
    this.unlisten();
  }

  handleDateChange (date) {
    let newStartDate = new Date(date);
    let endDate = new Date(this.state.endDate);
    let zeroDate = new Date(newStartDate.toDateString());
    if (newStartDate > endDate) {
      endDate = zeroDate;
      this.props.dispatch(this.props.selectEndDate(endDate.toISOString()));
    }
    if (date) {
      this.setState({
        date,
        minEndDate: date,
        endDate,
      });
      this.props.dispatch(this.props.selectDate(zeroDate.toISOString()));
    } else {
      this.setState({
        date: this.state.date
      });
    }
  }

  

  handleEndDateChange (endDate) {
    let zeroDate = new Date((new Date(endDate)).toDateString());
    if (endDate) {
      this.setState({
        endDate
      });
      zeroDate.setDate(zeroDate.getDate())
      this.props.dispatch(this.props.selectEndDate(zeroDate.toISOString()));
    } else {
      this.setState({
        endDate: this.state.endDate
      });
    }
    
  }
  
  handleVisualizationSelect(event) {
    if (event.target.value) {
      this.props.dispatch(this.props.selectVisualization(event.target.value));
      this.setState({
        selectedVisualization: event.target.value
      })
    }
  }

  componentWillReceiveProps(nextProps) {
    let params = QueryParams.decode(location.search.slice(1));
    params = _.pick(params, ['currentDate', 'endDate', 'visualization', 'currentEntityType', 'currentEntityId'])
    if (!_.isEqual(this.props.insights.ui, nextProps.insights.ui) && !_.isEqual(params, nextProps.insights.ui)) {
      history.push({
        search: QueryParams.encode(_.merge(params, nextProps.insights.ui))
      });
    }
  }

  handleEntitySelect(event) {
    if (event.target.value) {
      this.entityId = event.target.value.split("-")[1];
      this.entityType = event.target.value.split("-")[0];
      this.setState({
        params: {
          entityId: this.entityId, 
          entityType: this.entityType
        }
      });
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
    let endDatePicker = '';
    if (_.includes(['studentSummary', 'interactionTotals'], this.props.insights.ui.visualization)) {
      endDatePicker = (
        <div className="row">
          <div className="col-md-12">
            <label>To: </label>
            <DatePicker maxDate={this.state.maxEndDate} minDate={this.state.minEndDate} showClearButton={false} value={this.props.insights.ui.endDate} onChange={this.handleEndDateChange.bind(this)} />
          </div>
        </div>
      )
    }

    return (
      <div>
        <div className="row">
          <div className="col-md-12">
            <form>
              <div className="form-group">
                <label>Visualization</label>
                <select className="form-control" name="select-entity" value={this.props.insights.ui.visualization} onChange={this.handleVisualizationSelect}>
                  <option value="">Select visualization..</option>
                  <option key={`activity-timeline`} value={`activityTimeline`}>Activity Timeline</option>
                  <option key={`segmented-timeline`} value={`segmentedTimeline`}>Segmented Timeline</option>
                  <option key={`interaction-totals`} value={`interactionTotals`}>Interaction Totals</option>
                  <option key={`student-summary`} value={`studentSummary`}>Student Summary</option>
                </select>
              </div>
            </form>
          </div>
        </div>
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
        <div className="row" style={{marginBottom: '10px'}}>
          <div className="col-md-12">
            { _.includes(['studentSummary', 'interactionTotals'], this.props.insights.ui.visualization) ? <label>From: </label> : <label>On: </label>}
            <DatePicker maxDate={this.state.maxStartDate} showClearButton={false} value={this.props.insights.ui.currentDate} onChange={this.handleDateChange.bind(this)} />
          </div>
        </div>
        {endDatePicker}
      </div>
    )
  }
}

export default ActivityTimelineControls;
