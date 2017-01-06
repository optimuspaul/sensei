import React from 'react';
import _ from 'lodash';

class SubNav extends React.Component {


  render() {

    return (
      <div>
        <div className={`secondary-nav-link ${location.pathname.indexOf('events/sensors') !== -1 ? 'active' : ''}`}>
          <a href={`/networks/wf/events/sensors${location.search}`}>Assign Sensors</a>
        </div>
        <div className={`secondary-nav-link ${location.pathname.indexOf('events/entities') !== -1 ? 'active' : ''}`}>
          <a href={`/networks/wf/events/entities${location.search}`}>Manage Materials & Areas</a>
        </div>
      </div>
    )
  }
}

export default SubNav;
