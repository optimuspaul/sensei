
import * as d3 from "d3";
import _ from 'lodash';
import moment from 'moment';




export default function segmentData(dataEntities, storeEntities, entitiesToShow) {

/*
    Creates an object containing the data necessary for drawing the observation
    points provided for each entity
   */
  let segmentedData = _.reduce(dataEntities, (current, entity_data, index) => {
    let entityType = entityInflections[entity_data[0]];
    if (!_.includes(entitiesToShow[currentEntityType], entityType)) {
      return current
    }
    let entityId = entity_data[1];
    let entity = storeEntities[entityType][entityId];
    let entityName = entity ? entity.displayName : "Unknown";
    current[entityType] = current[entityType] || {obs: [], entities: []};
    current[entityType].obs.push(data.obs[index]);
    current[entityType].entities.push({entityName, entityId, entityType});
    current[entityType].y = current[entityType].y || index + _.size(current);
    return current;
  }, {});

  return segmentedData

}
