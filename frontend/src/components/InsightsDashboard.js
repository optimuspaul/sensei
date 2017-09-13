import React from 'react';
import _ from 'lodash';
import d3 from 'd3';
import {Grid, Row, Col, Thumbnail, Button, ButtonToolbar} from 'react-bootstrap';
import {frontendBaseUrl} from './../constants';
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

  render() {

    return (
      <Grid fluid="true" className="insights-dashboard">
        <Row>
          <Col md={8}><h2>Classroom Insights</h2>
            <p>This section provides various tools for gaining insights about your classroom, your students, and their progress.</p>
          </Col>
        </Row>
        <Row>
        <Col xs={6} md={4}>
          <Thumbnail className="insight-thumbnail" src={`${frontendBaseUrl()}/segmentedGraph.png`} alt="242x200">
            <h4>What interactions happened in my classroom yesterday?</h4>
            <p>
              <ButtonToolbar>
                <Button bsSize="small" bsStyle="primary">View</Button> {' '}
                <Button bsSize="small" bsStyle="default">Customize</Button>
              </ButtonToolbar>
            </p>
          </Thumbnail>
        </Col>
        <Col xs={6} md={4}>
          <Thumbnail className="insight-thumbnail" src={`${frontendBaseUrl()}/studentSummary.png`} alt="242x200">
            <h4>What did Billy spend his time doing last week?</h4>
            <p>
              <ButtonToolbar>
                <Button bsSize="small" bsStyle="primary">View</Button> {' '}
                <Button bsSize="small" bsStyle="default">Customize</Button>
              </ButtonToolbar>
            </p>
          </Thumbnail>
        </Col>
        <Col xs={6} md={4}>
          <Thumbnail className="insight-thumbnail" src={`${frontendBaseUrl()}/socialGraph.png`} alt="242x200">
            <h4>What groups are forming among the students?</h4>
            <p>
              <ButtonToolbar>
                <Button bsSize="small" bsStyle="primary">View</Button> {' '}
                <Button bsSize="small" bsStyle="default">Customize</Button>
              </ButtonToolbar>
            </p>
          </Thumbnail>
        </Col>
        </Row>
      </Grid>
    )
  }
}

export default InsightsDashboard;
