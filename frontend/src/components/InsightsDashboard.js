import React from 'react';
import _ from 'lodash';
import d3 from 'd3';
import {Grid, Row, Col, Thumbnail, Button, ButtonToolbar} from 'react-bootstrap';
import {frontendBaseUrl, getClassroomId, getSchoolId} from './../constants';
import './InsightsDashboard.css';

class InsightsDashboard extends React.Component {

  constructor(props) {
    super(props);

  }
  componentWillReceiveProps(nextProps) {

  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  handleClick = (event) => {
    debugger
  }

  render() {

    let today = (new Date((new Date()).toDateString())).toISOString();
    let yesterday = (new Date((new Date()).toDateString()));
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday = yesterday.toISOString();
    let lastMonth = (new Date((new Date()).toDateString()));
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth = lastMonth.toISOString();

    return (
      <Grid className="insights-dashboard">
        <Row>
          <Col md={8}><h2>Classroom Insights</h2>
            <p>This section provides various tools for gaining insights about your classroom, your students, and their progress.</p>
          </Col>
        </Row>
        <Row>
        <Col className="insight-card" xs={6} md={4}>
          <Thumbnail onClick={() => {window.location=`/s/${getSchoolId()}/networks/wf/events/insights?currentDate=${yesterday}&visualization=activityTimeline&currentEntityType=child&currentEntityId=${this.props.defaultEntity.id}`}} className="insight-thumbnail" src={`${frontendBaseUrl()}/activityTimeline.png`} alt="242x200">
            <h4>Activity Timeline</h4>
            <p>
              Shows who a given student or teacher interacted with throughout the day
            </p>
          </Thumbnail>
        </Col>
        <Col className="insight-card" xs={6} md={4}>
          <Thumbnail onClick={() => {window.location=`/s/${getSchoolId()}/networks/wf/events/insights?currentDate=${lastMonth}&endDate=${today}&visualization=studentSummary&currentEntityType=child&currentEntityId=${this.props.defaultEntity.id}`}} className="insight-thumbnail" src={`${frontendBaseUrl()}/studentSummary.png`} alt="242x200">
            <h4>Activity Summary</h4>
            <p>
              Shows the relative times spent with materials, in areas, or interacting with other kids for a given time period
            </p>
          </Thumbnail>
        </Col>
        <Col className="insight-card" xs={6} md={4}>
          <Thumbnail onClick={() => {window.location=`/s/${getSchoolId()}/networks/wf/events/insights?currentDate=${lastMonth}&endDate=${today}&visualization=unitSummary&currentEntityType=child&currentEntityId=${this.props.defaultEntity.id}`}} className="insight-thumbnail" src={`${frontendBaseUrl()}/unitSummary.png`} alt="242x200">
            <h4>Activity Totals</h4>
            <p>
              Shows how much time a student has spent interacting with others over a given time period
            </p>
          </Thumbnail>
        </Col>
        <Col className="insight-card" xs={6} md={4}>
          <Thumbnail onClick={() => {window.location=`/s/${getSchoolId()}/networks/wf/events/insights?currentDate=${yesterday}&endDate=${today}&visualization=socialGraph&currentEntityType=child&currentEntityId=${this.props.defaultEntity.id}`}} className="insight-thumbnail" src={`${frontendBaseUrl()}/socialGraph.png`} alt="242x200">
            <h4>Social Graph</h4>
            <p>
              Shows how a student is linked to their classmates based on the level of interaction over a given period of time
            </p>
          </Thumbnail>
        </Col>
        </Row>
      </Grid>
    )
  }
}

export default InsightsDashboard;
