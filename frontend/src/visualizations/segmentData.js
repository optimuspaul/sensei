import * as d3 from "d3";
import _ from 'lodash';
import moment from 'moment';
import {entityInflections} from './../constants';
import store from './../store/configureStore';


export default function segmentData(data, entitiesToShow) {
  let state = store.getState();
  let storeEntities = state.entities;
  let currentEntityType = state.insights.ui.currentEntityType;
/*
    Creates an object containing the data necessary for drawing the observation
    points provided for each entity
   */
  let segmentedData = _.reduce(data.entities, (current, entity_data, index) => {
    let entityType = entityInflections[entity_data[0]];
    if (entitiesToShow && !_.includes(entitiesToShow[currentEntityType], entityType)) {
      return current
    }
    let entityId = entity_data[1];
    let entity = storeEntities[entityType][entityId];
    let entityName = entity ? entity.displayName : "Unknown";
    current[entityType] = current[entityType] || {entities: []};
    current[entityType].entities.push({entityName, entityId, entityType, obs: data.obs[index]});
    current[entityType].y = current[entityType].y || index + _.size(current);
    return current;
  }, {});

  return _.toPairs(segmentedData);

}
