import './index.css';
import SensorMappingInterfaceContainer from './containers/SensorMappingInterfaceContainer';
import ManageEntitiesInterfaceContainer from './containers/ManageEntitiesInterfaceContainer';
import ActivityTimelineControlsContainer from './containers/ActivityTimelineControlsContainer';
import InsightsDashboardContainer from './containers/InsightsDashboardContainer';
import SubNav from './components/SubNav';
import React from 'react';
import ReactDOM from 'react-dom';
import store from './store/configureStore';
import { Provider } from 'react-redux';
import {fetchMappings} from './actions/sensorMappingActions';
import {fetchChildren, fetchTeachers, fetchEntities, fetchMaterials} from './actions/entityActions';
import {getClassroomId, isProduction, entityInflections, getSchoolId} from './constants';
import {fetchObservations, fetchInteractionPeriods, fetchInteractionTotals} from './actions/insightsActions';
import {toggleAnonymizer} from './actions/entityActions';
import _ from 'lodash';
import './index.css';
import activityTimeline from './visualizations/activityTimeline';
import segmentedTimeline from './visualizations/segmentedTimeline';
import studentSummary from './visualizations/studentSummary';
import unitSummary from './visualizations/unitSummary';
import socialGraph from './visualizations/socialGraph';
import key from 'keyboard-shortcut';



  key('ctrl shift a', function (e) {
    store.dispatch(toggleAnonymizer());
    store.dispatch(fetchChildren());
  });

  // check to see if school is using sensors. hard coded to classroom ID 725 for now
  let classroomId = getClassroomId();
  let schoolId = getSchoolId();
  if (classroomId === "725" || classroomId === "676" || classroomId === "1289" || !isProduction()) {

    

    let attempts = 0;
    let foundationEl, insertionPoint;

    
    setupDom('#foundation')
      .then(setupSensei)
      .catch(console.log);

    setupDom('.primary-nav')
      .then(setupNavs)
      .catch(console.log);

    function setupDom(selector) {
      let element;
      let attempts = 0;
      return new Promise((resolve, reject) => {
        let intervalCode = setInterval(function(){
          if (attempts > 10) {
            clearInterval(intervalCode);
            reject(`'${selector}' not found`);
          } else {
            element = document.querySelector(selector);
            if (element) {
              clearInterval(intervalCode);
              resolve(element)
            } else {
              attempts++;
              return;
            }
          }
        }, 1000);
      })
    }

    function setupNavs(insertionPoint) {
      let dynamicPrimaryNav = document.createElement("a");
      dynamicPrimaryNav.className = "primary-nav-link";
      dynamicPrimaryNav.id = "sensors-nav";
      dynamicPrimaryNav.href = `/s/${schoolId}/networks/wf/events/sensors${classroomId ? '?classroom_id=' + classroomId : '' }`;
      dynamicPrimaryNav.innerHTML = `<i class="fa fa-cubes"></i><span>Sensors</span>`
      insertionPoint && insertionPoint.appendChild(dynamicPrimaryNav);

      if (location.pathname.indexOf('wf/events') !== -1) {
        dynamicPrimaryNav.classList.add('active');
        let dynamicSecondaryNav = document.createElement("div");
        dynamicSecondaryNav.className = "secondary-nav-link";
        let secondaryNav = document.querySelector('.secondary-nav');

        // remove the "Network" tab from the secondary nav if it exists
        let secondaryNavNetworkLink = document.querySelector('.secondary-nav .secondary-nav-link');
        if (secondaryNavNetworkLink && _.includes(secondaryNavNetworkLink.innerText, 'Network')) {
          secondaryNavNetworkLink.remove();
        }

        secondaryNav && secondaryNav.insertBefore(dynamicSecondaryNav, document.querySelector('.secondary-nav .clear'))
        ReactDOM.render(
          <SubNav/>,
          dynamicSecondaryNav
        )
      }
    }

    function setupSensei(foundationEl) {
      if (location.pathname.indexOf('wf/events/sensors') !== -1) {
        document.title = 'Sensors';

        ReactDOM.render(
          <Provider store={store}>
            <SensorMappingInterfaceContainer/>
          </Provider>,
          foundationEl
        );

        store.dispatch(fetchChildren());
        store.dispatch(fetchTeachers());
        store.dispatch(fetchEntities('areas'));
        store.dispatch(fetchMaterials());
        store.dispatch(fetchMappings());

      }

      if (location.pathname.indexOf('wf/events/entities') !== -1) {
        document.title = 'Manage Areas';

        ReactDOM.render(
          <Provider store={store}>
            <ManageEntitiesInterfaceContainer/>
          </Provider>,
          foundationEl
        );

        store.dispatch(fetchMaterials());
        store.dispatch(fetchEntities('areas'));

      }

      if (location.pathname.indexOf('wf/events/insights/dashboard') !== -1) {

        store.dispatch(fetchChildren());
        store.dispatch(fetchTeachers());
        store.dispatch(fetchEntities('areas'));
        store.dispatch(fetchMaterials());

        ReactDOM.render(
          <Provider store={store}>
            <InsightsDashboardContainer/>
          </Provider>,
          foundationEl
        );

      } else { 

        if (location.pathname.indexOf('wf/events/insights') !== -1) {
  
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
          store.dispatch(fetchMaterials());

          let prevEntityUid, prevDate, prevEndDate, prevVisualization, prevInteractionType, prevZoom;

          store.subscribe(() => {
            let state = store.getState();
            let entityId = _.get(state, 'insights.ui.currentEntityId');
            let entityType = _.get(state, 'insights.ui.currentEntityType');
            let visualization = _.get(state, 'insights.ui.visualization');
            let interactionType = _.get(state, 'insights.ui.interactionType');
            let entityUid = `${entityType}-${entityId}`
            let date = _.get(state, 'insights.ui.currentDate');
            let endDate = _.get(state, 'insights.ui.endDate');
            let zoom = _.get(state, 'insights.ui.zoom');
            let status = _.get(state, 'insights.status');
            let entity = _.get(state, `entities.${entityInflections[entityType]}.${entityId}`);
            let entityName = entity && entity.displayName;

            if (entityId && entityType && date && visualization && (endDate && _.includes(['studentSummary', 'unitSummary'], visualization) || !_.includes(['studentSummary', 'unitSummary'], visualization))) {
              if (entityUid === prevEntityUid && date === prevDate && endDate === prevEndDate && prevVisualization === visualization && prevInteractionType === interactionType && prevZoom === zoom) {
                let dateString = (new Date(date)).toDateString();
                if (endDate) {
                  dateString += ` to ${(new Date(endDate)).toDateString()}`
                }
                document.querySelector("#visualization-title").innerHTML = `${entityName} <small>${dateString}</small>`
                let observationsData = state.insights.observations[entityUid];
                if (observationsData && (!_.isEmpty(observationsData.entities) && !_.isEmpty(observationsData.timestamps))) {
                  switch(visualization) {
                    case 'activityTimeline':
                      activityTimeline(observationsData);
                      break;
                    case 'segmentedTimeline':
                      segmentedTimeline(observationsData);
                      break;

                    case 'unitSummary':
                      unitSummary(observationsData);
                      break;
                    case 'studentSummary':
                      studentSummary(observationsData);
                      break;
                    case 'socialGraph':
                      socialGraph(observationsData);
                      break;
                  }
                } else {
                  if (status === 'fetched') {
                    document.querySelector("#visualization").innerHTML = '<h3>No data</h3>';
                  }
                }
              } else {
                document.querySelector("#visualization").innerHTML = '<h3>loading...</h3>';
                document.querySelector("#visualization-title").innerHTML = '';
                switch(visualization) {
                  case 'activityTimeline':
                    store.dispatch(fetchObservations(entityId, entityType, date, interactionType));
                    break;
                  case 'segmentedTimeline':
                    store.dispatch(fetchInteractionPeriods(entityId, entityType, date));
                    break;
                  case 'socialGraph':
                    store.dispatch(fetchInteractionTotals(null, null, date, endDate));
                  case 'unitSummary':
                  case 'studentSummary':
                    if (endDate && !(visualization === 'unitSummary' && !interactionType)) {
                      store.dispatch(fetchInteractionTotals(entityId, entityType, date, endDate, visualization === 'unitSummary' && interactionType));
                    } else {
                      document.querySelector("#visualization").innerHTML = '';
                    }
                    break;
                }
              }
              prevVisualization = visualization;
              prevInteractionType = interactionType;
              prevDate = date;
              prevEndDate = endDate;
              prevEntityUid = entityUid;
              prevZoom = zoom;
            }
          })
        }
      }
    }

    
  }


