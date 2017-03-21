import React from 'react';
import _ from 'lodash';
import {getClassroomId, getSchoolId} from './../constants';

class SubNav extends React.Component {


  render() {

    return (
      <div>
        <div className={`secondary-nav-link ${location.pathname.indexOf('events/sensors') !== -1 ? 'active' : ''}`}>
          <a href={`/s/${getSchoolId()}/networks/wf/events/sensors?classroom_id=${getClassroomId()}`}>Assign Sensors</a>
        </div>
        <div className={`secondary-nav-link ${location.pathname.indexOf('events/entities') !== -1 ? 'active' : ''}`}>
          <a href={`/s/${getSchoolId()}/networks/wf/events/entities?classroom_id=${getClassroomId()}`}>Manage Materials & Areas</a>
        </div>
        <div className={`secondary-nav-link ${location.pathname.indexOf('events/insights') !== -1 ? 'active' : ''}`}>
          <a href={`/s/${getSchoolId()}/networks/wf/events/insights?classroom_id=${getClassroomId()}`}>Insights</a>
        </div>
      </div>
    )
  }
}

export default SubNav;
