import './index.css';
import CameraSegmentBuilderContainer from './containers/CameraSegmentBuilderContainer';
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
import {fetchObservations, fetchInteractionPeriods, fetchInteractionTotals, updateCurrentVisualization} from './actions/insightsActions';
import {toggleAnonymizer} from './actions/entityActions';
import _ from 'lodash';
import './index.css';
import * as visualizations from './visualizations';
import key from 'keyboard-shortcut';



  key('ctrl shift a', function (e) {
    store.dispatch(toggleAnonymizer());
    store.dispatch(fetchChildren());
  });

  if (document.querySelector("#sensei")) {
    ReactDOM.render(
      <Provider store={store}>
        <CameraSegmentBuilderContainer/>
      </Provider>,
      document.querySelector("#sensei")
    );
  }

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
      let activePrimary = document.querySelector('.primary-nav-link.active');
      if (activePrimary) activePrimary.classList.remove('active');
      let dynamicPrimaryNav = document.createElement("a");
      dynamicPrimaryNav.className = "primary-nav-link";
      dynamicPrimaryNav.id = "sensors-nav";
      dynamicPrimaryNav.href = `/s/${schoolId}/networks/wf/events/insights/dashboard${classroomId ? '?classroom_id=' + classroomId : '' }`;
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

      if (location.pathname.indexOf('wf/events/locations') !== -1) {

        store.dispatch(fetchChildren());
        store.dispatch(fetchTeachers());
        store.dispatch(fetchEntities('areas'));
        store.dispatch(fetchMaterials());
        store.dispatch(fetchMappings());

        foundationEl.innerHTML = `
          <div class='row'>
            <div class='col-md-12' id='locations-viz-container'>
              <div id='visualization' class='locations'><svg></svg></div>
            </div>
          </div>
        `;

        visualizations.locations();

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
              <div class='col-md-3' id='insights-nav-container'></div>
              <div class='col-md-9'>
                <h2 id='visualization-title'></h2>
                <hr />
                <div id='visualization'></div>
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
          store.dispatch(updateCurrentVisualization());

          store.subscribe(() => {
            let visualizationsElement = document.querySelector("#visualization");
            let state = store.getState();
            let visualization = _.get(state, 'insights.ui.visualization');
            let observationsData = _.get(state, `insights.currentObservationsData`);
            if (!visualization) return;
            let date = _.get(state, 'insights.ui.currentDate');
            let vizElement = document.querySelector(`#visualization div#${visualization}.viz`);
            let allVizElements = document.querySelectorAll('#visualization .viz');
            document.querySelector("#visualization-title").innerHTML = _.get(state, 'insights.ui.visualizationTitle', 'loading..');
            _.each(allVizElements, (s) => {
              s.style.display = 'none';
            });
            if (!vizElement) {
              vizElement = document.createElement('div');
              vizElement.id = visualization;
              vizElement.className = "viz";
              vizElement.innerHTML = '<svg></svg>';
              visualizationsElement.append(vizElement);
              visualizations[visualization]();
            }
            vizElement.style.display = 'inline';
            var event = new CustomEvent('dataChanged', { detail: observationsData });
            vizElement.dispatchEvent(event);
            // some vizualizations don't want to render correctly the first time and need to be kicked
            if (visualization !== 'socialGraph') {
              setTimeout(() => { 
                vizElement.dispatchEvent(event); 
              }, 1000);
            }
          });
        }
      }
    }


  }
