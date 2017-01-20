import React from 'react';
import _ from 'lodash';
import {getClassroomId} from './../constants';

class SubNav extends React.Component {


  render() {

    return (
      <div>
        <div className={`secondary-nav-link ${location.pathname.indexOf('events/sensors') !== -1 ? 'active' : ''}`}>
          <a href={`/networks/wf/events/sensors?classroom_id=${getClassroomId()}`}>Assign Sensors</a>
        </div>
        <div className={`secondary-nav-link ${location.pathname.indexOf('events/entities') !== -1 ? 'active' : ''}`}>
          <a href={`/networks/wf/events/entities?classroom_id=${getClassroomId()}`}>Manage Materials & Areas</a>
        </div>
      </div>
    )
  }
}

export default SubNav;
