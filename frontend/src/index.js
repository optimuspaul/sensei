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
import {getClassroomId, isProduction, entityInflections, getSchoolId} from './constants';
import {fetchObservations, fetchInteractionPeriods, fetchInteractionTotals} from './actions/insightsActions';
import {toggleAnonymizer} from './actions/entityActions';
import _ from 'lodash';
import './index.css';
import activityTimeline from './visualizations/activityTimeline';
import segmentedTimeline from './visualizations/segmentedTimeline';
import interactionTotals from './visualizations/interactionTotals';
import studentSummary from './visualizations/studentSummary';
import key from 'keyboard-shortcut';

setTimeout(function(){

  key('ctrl shift a', function (e) {
    store.dispatch(toggleAnonymizer());
    store.dispatch(fetchChildren());
  });

  // check to see if school is using sensors. hard coded to classroom ID 725 for now
  let classroomId = getClassroomId();
  let schoolId = getSchoolId();
  if (classroomId === "725" || classroomId === "676" || classroomId === "1289" || !isProduction()) {

    let dynamicPrimaryNav = document.createElement("a");
    dynamicPrimaryNav.className = "primary-nav-link";
    dynamicPrimaryNav.id = "sensors-nav";
    dynamicPrimaryNav.href = `/s/${schoolId}/networks/wf/events/sensors${classroomId ? '?classroom_id=' + classroomId : '' }`;
    dynamicPrimaryNav.innerHTML = `<i class="fa fa-cubes"></i><span>Sensors</span>`
    let insertionPoint = document.querySelector('.primary-nav');
    insertionPoint && insertionPoint.appendChild(dynamicPrimaryNav);

    if (location.pathname.indexOf('wf/events') !== -1) {
      dynamicPrimaryNav.classList.add('active');
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

      let prevEntityUid, prevDate, prevEndDate, prevVisualization;

      store.subscribe(() => {
        let state = store.getState();
        let entityId = _.get(state, 'insights.ui.currentEntityId');
        let entityType = _.get(state, 'insights.ui.currentEntityType');
        let visualization = _.get(state, 'insights.ui.visualization');
        let entityUid = `${entityType}-${entityId}`
        let date = _.get(state, 'insights.ui.currentDate');
        let endDate = _.get(state, 'insights.ui.endDate');
        let status = _.get(state, 'insights.status');

        if (entityId && entityType && date && visualization && (endDate && _.includes(['studentSummary', 'interactionTotals'], visualization) || !_.includes(['studentSummary', 'interactionTotals'], visualization))) {
          if (entityUid === prevEntityUid && date === prevDate && endDate === prevEndDate && prevVisualization === visualization) {
            let entity = _.get(state, `entities.${entityInflections[entityType]}.${entityId}`);
            let dateString = (new Date(date)).toDateString();
            if (endDate) {
              dateString += ` to ${(new Date(endDate)).toDateString()}`
            }
            document.querySelector("#visualization-title").innerHTML = `${entity.displayName} <small>${dateString}</small>`
            let observationsData = state.insights.observations[entityUid];
            if (observationsData && (!_.isEmpty(observationsData.entities) && !_.isEmpty(observationsData.timestamps))) {
              switch(visualization) {
                case 'activityTimeline':
                  activityTimeline(observationsData);
                  break;
                case 'segmentedTimeline':
                  segmentedTimeline(observationsData);
                  break;
                case 'interactionTotals':
                  interactionTotals(observationsData);
                  break;
                case 'studentSummary':
                  studentSummary(observationsData);
                  break;
              }
            } else {
              debugger
              if (status === 'fetched') {
                document.querySelector("#visualization").innerHTML = '<h3>No data</h3>';
              }
            }
          } else {
            document.querySelector("#visualization").innerHTML = '<h3>loading...</h3>';
            document.querySelector("#visualization-title").innerHTML = '';
            switch(visualization) {
              case 'activityTimeline':
                store.dispatch(fetchObservations(entityId, entityType, date));
                break;
              case 'segmentedTimeline':
                store.dispatch(fetchInteractionPeriods(entityId, entityType, date));
                break;
              case 'interactionTotals':
              case 'studentSummary':
                if (endDate) {
                  store.dispatch(fetchInteractionTotals(entityId, entityType, date, endDate));
                } else {
                  document.querySelector("#visualization").innerHTML = '';
                }
                break;
            }
          }
          prevVisualization = visualization;
          prevDate = date;
          prevEndDate = endDate;
          prevEntityUid = entityUid;
        }
      })
    }
  }
}, 500);
