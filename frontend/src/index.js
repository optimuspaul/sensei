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
import {getClassroomId, isProduction, entityInflections} from './constants';
import {fetchObservations} from './actions/insightsActions';
import {toggleAnonymizer} from './actions/entityActions';
import _ from 'lodash';
import './index.css';
import activityTimeline from './visualizations/activityTimeline';
import key from 'keyboard-shortcut';

setTimeout(function(){

  key('ctrl shift a', function (e) {
    store.dispatch(toggleAnonymizer());
    store.dispatch(fetchChildren());
  });

  // check to see if school is using sensors. hard coded to classroom ID 725 for now
  let classroomId = getClassroomId();
  if (classroomId === "725" || classroomId === "676" || classroomId === "1289" || !isProduction()) {

      let dynamicPrimaryNav = document.createElement("a");
      dynamicPrimaryNav.className = "primary-nav-link";
      dynamicPrimaryNav.href = `/networks/wf/events/sensors${classroomId ? '?classroom_id=' + classroomId : '' }`;
      dynamicPrimaryNav.innerHTML = `<i class="fa fa-cubes"></i><span>Sensors</span>`
      document.querySelector('.primary-nav').appendChild(dynamicPrimaryNav);

    if (location.pathname.indexOf('wf/events') !== -1) {
      let dynamicSecondaryNav = document.createElement("div");
      dynamicSecondaryNav.className = "secondary-nav-link";
      let secondaryNav = document.querySelector('.secondary-nav');
      secondaryNav && secondaryNav.insertBefore(dynamicSecondaryNav, document.querySelector('.secondary-nav .clear'))
      ReactDOM.render(
        <SubNav/>,
        dynamicSecondaryNav
      )


    }


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

      let prevEntityUid, prevDate;

      store.subscribe(() => {
        let state = store.getState();
        let entityId = _.get(state, 'insights.ui.currentEntityId');
        let entityType = _.get(state, 'insights.ui.currentEntityType');
        let entityUid = `${entityType}-${entityId}`
        let date = _.get(state, 'insights.ui.currentDate');

        if (entityId && entityType && date) {
          if ((entityUid === prevEntityUid) && date === prevDate) {
            let entity = _.get(state, `entities.${entityInflections[entityType]}.${entityId}`);
            let dateString = (new Date(date)).toDateString();
            document.querySelector("#visualization-title").innerHTML = `${entity.displayName} <small>${dateString}</small>`
            let observationsData = state.insights.observations[entityUid];
            if (observationsData && !_.isEmpty(observationsData.timestamps)) {
              activityTimeline(observationsData);
            } else {
              document.querySelector("#visualization").innerHTML = '<h3>No data</h3>';
            }
          } else {
            document.querySelector("#visualization").innerHTML = '<h3>loading...</h3>';
            store.dispatch(fetchObservations(entityId, entityType, date));
            prevDate = date;
            prevEntityUid = entityUid;
          }
        }
      })
    }
  }
}, 500);
