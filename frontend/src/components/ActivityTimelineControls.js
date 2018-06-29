import React from 'react';
import _ from 'lodash';
import DatePicker from 'react-bootstrap-date-picker';
import QueryParams from 'query-params';
import { history } from '../utils';
import DayPicker from 'react-day-picker';
import 'react-day-picker/lib/style.css';
import KeyHandler, {KEYDOWN} from 'react-key-handler';
import moment from 'moment';
import { Button } from 'react-bootstrap';

class ActivityTimelineControls extends React.Component {

  constructor(props) {
    super(props);
    this.handleEntitySelect = this.handleEntitySelect.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);
    this.handleEndDateChange = this.handleEndDateChange.bind(this);
    this.handleVisualizationSelect = this.handleVisualizationSelect.bind(this);
    this.handleInteractionTypeSelect = this.handleInteractionTypeSelect.bind(this);
    this.handleZoomSet = this.handleZoomSet.bind(this);
    this.handleZoomChange = this.handleZoomChange.bind(this);
    this.handleLiveCheckboxChanged = this.handleLiveCheckboxChanged.bind(this);

    let params = QueryParams.decode(location.search.slice(1));

    let date = new Date((params.currentDate ? new Date(params.currentDate) : new Date()).toDateString());
    date = date.toISOString();

    let endDate = new Date((params.endDate ? new Date(params.endDate) : new Date()).toDateString());
    endDate = endDate.toISOString();

    this.state = {
      date,
      endDate,
      maxEndDate: (new Date()).toISOString(),
      minEndDate: date,
      selectedDays: []
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

  handleInteractionTypeSelect(event) {
    if (event.target.value) {
      this.props.dispatch(this.props.selectInteractionType(event.target.value));
      this.setState({
        selectedInteractionType: event.target.value
      })
    }
  }

  componentWillReceiveProps(nextProps) {
    let params = QueryParams.decode(location.search.slice(1));
    let toPick = ['currentDate', 'endDate', 'visualization', 'currentEntityType', 'currentEntityId', 'zoom', 'interactionType'];
    params = _.pick(params, toPick)
    let nextParams = _.pick(nextProps.insights.ui, toPick);
    let prevParams = _.pick(this.props.insights.ui, toPick);
    this.setState({zoom: params.zoom})
    if (!_.isEqual(prevParams, nextParams) && !_.isEqual(params, nextParams)) {
      history.push({
        search: QueryParams.encode(_.merge(params, _.omit(nextProps.insights.ui, ['visualizationTitle'])))
      });
    }
  }

  handleZoomChange(event) {
    this.setState({zoom:event.target.value});
  }

  handleToggleDiagnostics = (event) => {
    this.props.dispatch(this.props.toggleDiagnosticsMode());
  }

  handleZoomSet(event) {
    let zoom = this.state.zoom;
    if (event.key) {
      if (event.key === 'ArrowLeft' && zoom > 1) {
        zoom--
      } else if (event.key === 'ArrowRight' && zoom < _.size(_.get(this.props.insights, `currentObservationsData.obs`))) {
        zoom++
      }
    } else {
      zoom = event.target.value;
    }
    this.setState({zoom});
    this.props.dispatch(this.props.setZoom(zoom));
  }

  handleLiveCheckboxChanged(event) {

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

  handleDayClick = (clickedDay, { selected }) => {
    let selectedDays = this.state.selectedDays;
    if (selected) {
      this.props.dispatch(this.props.removeDay(clickedDay));
    } else {
      this.props.dispatch(this.props.addDay(clickedDay));
    }

  };

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
    if (_.includes(['studentSummary', 'unitSummary', 'socialGraph', 'segmentedTimeline'], this.props.insights.ui.visualization)) {
      endDatePicker = (
        <div className="row">
          <div className="col-md-12">
            <label>To: </label>
            <DatePicker maxDate={this.state.maxEndDate} minDate={this.state.minEndDate} showClearButton={false} value={this.props.insights.ui.endDate} onChange={this.handleEndDateChange.bind(this)} />
          </div>
        </div>
      )
    }

    let datePicker = (
      <DatePicker
        maxDate={this.state.maxStartDate}
        showClearButton={false}
        value={this.props.insights.ui.currentDate}
        onChange={this.handleDateChange.bind(this)}
      />
    )

    let interactionTypeSelector = '';
    if (_.includes(['unitSummary'], this.props.insights.ui.visualization)) {
      interactionTypeSelector = (
        <div className="row">
          <div className="col-md-12">
            <form>
              <div className="form-group">
                <label>Interactions</label>
                <select className="form-control" value={this.props.insights.ui.interactionType} name="select-entity" onChange={this.handleInteractionTypeSelect}>
                  <option value="">Select interaction type..</option>
                  <option key="children" value="children">Students</option>
                  <option key="teachers" value="teachers">Teachers</option>
                  <option key="areas" value="areas">Areas</option>
                  <option key="materials" value="materials">Materials</option>
                </select>
              </div>
            </form>
          </div>
        </div>
      )
    }

    



    let zoomControl = '';
    if (!_.includes(['studentSummary', 'socialGraph'], this.props.insights.ui.visualization)) {
      let isLocations = this.props.insights.ui.visualization === 'locations';
      let label = isLocations ? 'Timeline:' : 'Zoom level:'
      let max = isLocations ? _.size(_.get(this.props.insights, `currentObservationsData.obs`)) : 5;
      let currentVal = isLocations ? moment(_.get(this.props.insights, `currentObservationsData.obs.${max-this.state.zoom}.timestamp`)).format("h:mm:ss a") : this.state.zoom;


      zoomControl = (
        <div>
          <div className="row" style={{marginBottom: '10px'}}>
            <KeyHandler keyEventName={KEYDOWN} keyValue="ArrowRight" onKeyHandle={this.handleZoomSet} />
            <KeyHandler keyEventName={KEYDOWN} keyValue="ArrowLeft" onKeyHandle={this.handleZoomSet} />
            <div className="col-md-12">
              <label> {label} </label> {currentVal} 
              <input
                id="zoom-slider"
                type="range"
                defaultValue='1'
                value={this.state.zoom}
                min="1"
                max={max}
                step="1"
                onChange={this.handleZoomSet}
              />
            </div>
          </div>
          <div className="row" style={{marginBottom: '10px'}}>
            <div className="col-md-12">
              <Button active={this.props.insights.ui.isLive ?  true : false}
                bsStyle={this.props.insights.ui.isLive ? 'success' : 'default'}
                onClick={() => { this.props.dispatch(this.props.toggleLive()) }} >Live</Button>
            </div>
          </div>
        </div>
      )
    }

    let viewpointSelector = '';
    if (!_.includes(['studentSummary', 'socialGraph', 'locations'], this.props.insights.ui.visualization)) {
      viewpointSelector = (
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
      )
    }

    return (
      <div>
        <KeyHandler keyEventName={KEYDOWN} keyValue="d" onKeyHandle={this.handleToggleDiagnostics} />
        <div className="row">
          <div className="col-md-12">
            <form>
              <div className="form-group">
                <label>Visualization</label>
                <select className="form-control" name="select-entity" value={this.props.insights.ui.visualization} onChange={this.handleVisualizationSelect}>
                  <option value="">Select visualization..</option>
                  <option key={`activity-timeline`} value={`activityTimeline`}>Activity Timeline</option>
                  <option key={`segmented-timeline`} value={`segmentedTimeline`}>Segmented Timeline</option>
                  <option key={`student-summary`} value={`studentSummary`}>Student Summary</option>
                  <option key={`unit-summary`} value={`unitSummary`}>Unit Summary</option>
                  <option key={`social-graph`} value={`socialGraph`}>Social Graph</option>
                  <option key={`locations`} value={`locations`}>Sensor Locations</option>
                </select>
              </div>
            </form>
          </div>
        </div>
        {viewpointSelector}
        {interactionTypeSelector}
        <div className="row" style={{marginBottom: '10px'}}>
          <div className="col-md-12">
            { _.includes(['studentSummary', 'unitSummary'], this.props.insights.ui.visualization) ? <label>From: </label> : <label>On: </label>}
            {datePicker}
          </div>
        </div>
        {endDatePicker}
        {zoomControl}

      </div>
    )
  }
}

export default ActivityTimelineControls;
