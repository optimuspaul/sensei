import './index.css';
import SensorMappingInterfaceContainer from './containers/SensorMappingInterfaceContainer';
import ManageEntitiesInterfaceContainer from './containers/ManageEntitiesInterfaceContainer';
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

    let childId = 1;

    let foundationEl = document.querySelector("#foundation");
    foundationEl.innerHTML = "<svg id='visualization'></svg>";

    store.dispatch(fetchObservations(childId));

    store.subscribe(() => {
      activityTimeline(store.getState().insights.observations[childId]);
    })



  }


}, 200);
