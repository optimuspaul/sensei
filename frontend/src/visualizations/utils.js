import * as d3 from "d3";
import _ from 'lodash';
import moment from 'moment';
import {entityInflections} from './../constants';
import store from './../store/configureStore';


export const startAndEndTimes = (timestamps) => {
  let startTime = new Date(d3.min(timestamps));
  startTime.setMinutes(0);
  startTime.setSeconds(0);
  let endTime = new Date(d3.max(timestamps));
  endTime.setHours(endTime.getHours() + 2);
  endTime.setMinutes(0);
  endTime.setSeconds(0);
  return { startTime, endTime }
}

const ENTITIES_TO_SHOW = {
  child: ['children', 'areas', 'materials', 'teachers'],
  teacher: ['children', 'areas'],
  area: ['children', 'teachers'],
  material:  ['children']
}

/*
  Creates an object containing the data necessary for drawing the observation
  points provided for each entity
*/
export const segmentData = (data, entitiesToShow = ENTITIES_TO_SHOW) => {
  let state = store.getState();
  let storeEntities = state.entities;
  let currentEntityType = state.insights.ui.currentEntityType;
  let segmentedData = _.reduce(data.entities, (current, entityData, index) => {
    let entityType = entityInflections[entityData[0]];
    if (entitiesToShow && !_.includes(entitiesToShow[currentEntityType], entityType)) {
      return current
    }
    let entityId = entityData[1];
    let entity = storeEntities[entityType][entityId];
    let entityName = entity ? entity.displayName : "Unknown";
    current[entityType] = current[entityType] || {entities: []};
    current[entityType].entities.push({entityName, entityId, entityType, obs: data.obs[index]});
    current[entityType].y = current[entityType].y || index + _.size(current);
    return current;
  }, {});

  return _.toPairs(segmentedData);

}


/*
  Creates a scalar on the x axis that constrains all values to the
  fixed width of the visualization, specified by the STATIC_WIDTH
  constant defined above
 */
export const generateXScalar = (startTime, endTime, upperRange) => {

  return d3.scaleLinear()
    .domain([startTime.getTime(), endTime.getTime()])
    .range([0, upperRange]);
}


/*
  Determines the height of the chart based on the number of entities included
  with the observational data and the predetermined ROW_HEIGHT constant defined
  above, with an extra ROW_HEIGHT's worth of space added to the bottom to make
  space for the time tick labels
 */
export const calcChartHeight = (segmentedData, rowHeight = 30) => {
  let totalRows = _.sumBy(_.toArray(segmentedData), (entityType) => {
    return _.size(entityType[1].entities) + 1
  });
  return rowHeight * totalRows;
}

export const totalTimeTicks = (maxTotal, xScalar) => {
  let ticks = [[`0 min`, xScalar(0)]];
  let seconds = 0;
  while (seconds < maxTotal) {
    seconds += 600;
    let label = `${seconds/60} min`;
    ticks.push([label, xScalar(seconds)]);
  }
  return ticks;
}

/*
  Creates array of pairs that determine where the vertical timeline ticks
  are drawn and which hour label should be placed at the bottom of them to
  be fed into d3
 */
export const timelineTicks = (startTime, endTime, xScalar, zoom) => {
  let tmpTime = new Date(startTime.getTime());
  let ticks = [];
  while (tmpTime < endTime) {
    let label = moment(tmpTime).format('LT');
    ticks.push([label, xScalar(tmpTime.getTime())])
    if (zoom > 2) {
      tmpTime.setMinutes(tmpTime.getMinutes() + 15);
    } else {
      tmpTime.setHours(tmpTime.getHours() + 1);
    }
  }
  return ticks;
}