import './index.css';
import SensorMappingInterfaceContainer from './containers/SensorMappingInterfaceContainer';
import ManageEntitiesInterfaceContainer from './containers/ManageEntitiesInterfaceContainer';
import SubNav from './components/SubNav';
import React from 'react';
import ReactDOM from 'react-dom';
import store from './store/configureStore';
import { Provider } from 'react-redux';
import {fetchMappings} from './actions/sensorMappingActions';
import {fetchStudents, fetchTeachers, fetchEntities} from './actions/entityActions';



// TODO: real routing.
setTimeout(function(){
  let dynamicSecondaryNav = document.createElement("div");
  dynamicSecondaryNav.className = "secondary-nav-link";
  document.querySelector('.secondary-nav').insertBefore(dynamicSecondaryNav, document.querySelector('.secondary-nav .clear'))
  ReactDOM.render(
    <SubNav/>,
    dynamicSecondaryNav
  )

  let dynamicPrimaryNav = document.createElement("a");
  dynamicPrimaryNav.className = "primary-nav-link";
  dynamicPrimaryNav.href = `/networks/wf/events/sensors${location.search}`;
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

    store.dispatch(fetchStudents());
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
}, 200);



