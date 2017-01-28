import './index.css';
import SensorMappingInterfaceContainer from './containers/SensorMappingInterfaceContainer';
import ManageEntitiesInterfaceContainer from './containers/ManageEntitiesInterfaceContainer';
import ActivityTimelineControlsContainer from './containers/ActivityTimelineControlsContainer';
import SubNav from './components/SubNav';
import React from 'react';
import ReactDOM from 'react-dom';
import store from './store/configureStore';
import { Provider } from 'react-redux';
import {fetchMappings} from './actions/sensorMappingActions';
import {fetchChildren, fetchTeachers, fetchEntities} from './actions/entityActions';
import {fetchObservations} from './actions/insightsActions';
import _ from 'lodash';

import './index.css';
import activityTimeline from './visualizations/activityTimeline'

// TODO: real routing.
setTimeout(function(){
  let dynamicSecondaryNav = document.createElement("div");
  dynamicSecondaryNav.className = "secondary-nav-link";
  let secondaryNav = document.querySelector('.secondary-nav');
  secondaryNav && secondaryNav.insertBefore(dynamicSecondaryNav, document.querySelector('.secondary-nav .clear'))
  ReactDOM.render(
    <SubNav/>,
    dynamicSecondaryNav
  )

  let dynamicPrimaryNav = document.createElement("a");
  dynamicPrimaryNav.className = "primary-nav-link";
  let classroomId = _.get(window, 'tc.env.currentClassroomId');
  dynamicPrimaryNav.href = `/networks/wf/events/sensors${classroomId ? '?classroom_id=' + classroomId : '' }`;
  dynamicPrimaryNav.innerHTML = `<i class="fa fa-cubes"></i><span>Sensors</span>`
  document.querySelector('.primary-nav').appendChild(dynamicPrimaryNav);

  if (location.pathname.indexOf('wf/events/sensors') !== -1) {
    document.title = 'Sensors';

    ReactDOM.render(
      <Provider store={store}>
        <SensorMappingInterfaceContainer/>
      </Provider>,
      document.getElementById('foundation')
    );

    store.dispatch(fetchChildren());
    store.dispatch(fetchTeachers());
    store.dispatch(fetchEntities('areas'));
    store.dispatch(fetchEntities('materials'));
    store.dispatch(fetchMappings());

  }

  if (location.pathname.indexOf('wf/events/entities') !== -1) {
    document.title = 'Manage Materials & Areas';

    ReactDOM.render(
      <Provider store={store}>
        <ManageEntitiesInterfaceContainer/>
      </Provider>,
      document.getElementById('foundation')
    );

    store.dispatch(fetchEntities('areas'));
    store.dispatch(fetchEntities('materials'));

  }

  if (location.pathname.indexOf('wf/events/insights') !== -1) {



    let foundationEl = document.querySelector("#foundation");
    foundationEl.innerHTML = `
      <div class='row'>
        <div class='col-md-2' id='insights-nav-container'></div>
        <div class='col-md-10'>
          <h2 id='visualization-title'></h2>
          <hr />
          <div id='visualization'><svg></svg></div>
        </div>
      </div>
    `;

    ReactDOM.render(
      <Provider store={store}>
        <ActivityTimelineControlsContainer/>
      </Provider>,
      document.getElementById('insights-nav-container')
    );


    store.dispatch(fetchChildren());
    store.dispatch(fetchTeachers());
    store.dispatch(fetchEntities('areas'));
    store.dispatch(fetchEntities('materials'));

    let prevChildId, prevDate;

    store.subscribe(() => {
      let state = store.getState();
      let childId = _.get(state, 'insights.ui.currentChildId');
      let date = _.get(state, 'insights.ui.currentDate');

      if (childId && date) {
        if (childId === prevChildId && date === prevDate) {
          let child = _.get(state, `entities.children[${childId}]`);
          let dateString = (new Date(date)).toDateString();
          document.querySelector("#visualization-title").innerHTML = `${child.displayName} <small>${dateString}</small>`
          activityTimeline(state.insights.observations[childId]);
        } else {
          document.querySelector("#visualization").innerHTML = '<h3>loading...</h3>';
          store.dispatch(fetchObservations(childId, date));
          prevDate = date;
          prevChildId = childId;
        }
      }

    })



  }


}, 200);
