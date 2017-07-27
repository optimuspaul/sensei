import * as d3 from "d3";
import {entityInflections} from './../constants';
import store from './../store/configureStore';
import {selectEntity} from './../actions/insightsActions';
import timeTicks from './timeTicks';
import {startAndEndTimes} from './utils';
import _ from 'lodash';
import moment from 'moment';

const ROW_HEIGHT = 30; // how tall each row of data in timeline is

const OFFSET = 205; // how far to the right the observation points start being drawn
const VISUALIZATION_TEMPLATE = `
  <svg>
    <g id='ticks'></g>
    <g id='children' class='segments'></g>
    <g id='areas' class='segments'></g>
    <g id='materials' class='segments'></g>
    <g id='teachers' class='segments'></g>
  </svg>
`
const ENTITIES_TO_SHOW = {
  child: ['children', 'areas', 'materials', 'teachers'],
  teacher: ['children', 'areas'],
  area: ['children', 'teachers'],
  material:  ['children']
}

export default function activityTimeline(data) {

  if (!data) {
    return
  }

  let zoom = _.get(store.getState(), "insights.ui.zoom") || 1;

  const STATIC_WIDTH = 1260 * zoom; // how wide the width of the visualization is

  /*
    Initializes the template into the DOM
   */
  document.querySelector("#visualization").innerHTML = VISUALIZATION_TEMPLATE;



  let currentEntityType = _.get(store.getState(), "insights.ui.currentEntityType");

  /*
    Creates an object containing the data necessary for drawing the observation
    points provided for each entity
   */
  let segmentedData = _.reduce(data.entities, (current, entity_data, index) => {
    let entityType = entityInflections[entity_data[0]];
    if (!_.includes(ENTITIES_TO_SHOW[currentEntityType], entityType)) {
      return current
    }
    let entityId = entity_data[1];
    let entity = store.getState().entities[entityType][entityId];
    let entityName = entity ? entity.displayName : "Unknown";
    current[entityType] = current[entityType] || {obs: [], entities: []};
    current[entityType].obs.push(data.obs[index]);
    current[entityType].entities.push({entityName, entityId, entityType});
    current[entityType].y = current[entityType].y || index + _.size(current);
    return current;
  }, {});


  let {startTime, endTime} = startAndEndTimes(data.timestamps);

  /*
    Creates a scalar on the x axis that constrains all values to the
    fixed width of the visualization, specified by the STATIC_WIDTH
    constant defined above
   */
  var xScalar = d3.scaleLinear()
    .domain([startTime.getTime(), endTime.getTime()])
    .range([0, STATIC_WIDTH-OFFSET]);

  /*
    Determines the height of the chart based on the number of entities included
    with the observational data and the predetermined ROW_HEIGHT constant defined
    above, with an extra ROW_HEIGHT's worth of space added to the bottom to make
    space for the time tick labels
   */
  let chartHeight = (ROW_HEIGHT * _.sumBy(_.toArray(segmentedData), (entityType) => { return _.size(entityType.entities) + 1 }));


  timeTicks(startTime, endTime, {
    offset: OFFSET,
    chartHeight,
    staticWidth: STATIC_WIDTH,
    selector: '#visualization svg #ticks'
  });

  /*
    Initializes the chart with d3 using the STATIC_WIDTH constant defined above
    and the calculated chartHeight from above
   */
  let chart = d3.select("#visualization svg")
                  .attr("width", STATIC_WIDTH)
                  .attr("height", chartHeight + 20);


  // builds each entity type section using the segmentedData generated above
  _.each(segmentedData, buildSection);

  /*
    Builds each entity row in the timeline visualization by taking the entity data
    and entity type provided and creating a label and plotting the observations using
    d3 and scaled linearly to fit the SVG's fixed width
   */
  function buildSection(entityData, entityType) {

    // selects group tag that corresponds to the current entity type
    let section = chart.select(`#${entityType}`);

    // sets the y displacement for the current entity type group
    section.attr("transform", "translate(0," + ((entityData.y * ROW_HEIGHT)) + ")");

    // adds the entity type label for the current entity group
    section.append("text")
           .attr("x", 0)
           .attr("y", 0)
           .attr("style", "font-weight: bold")
           .text(entityType);

    /*
      adds a row for each entity included in the current entity type group and sets
      its correct y displacement
     */
    let row = section.selectAll("g")
              .data(entityData.entities)
              .enter().append("g")
              .attr("transform", function(entity, index) { return "translate(0," + index * ROW_HEIGHT + ")"; });

    // adds the entity display names as labels for each entity row within the current group
    row.append("text")
        .attr("x", 5)
        .attr("y", ROW_HEIGHT / 1.5)
        .attr("dy", ".35em")
        .attr('class', 'entity-label')
        .text(function(entity) { return entity.entityName })
        .on('click', (entity) => {
          store.dispatch(selectEntity(entity.entityId, _.invert(entityInflections)[entity.entityType]))
        });

    /*
      plots the observations for each entity within the current entity type group. The
      radius of the obervation point is based on the total value of all the integers
      included in the observation data pair. Each observation point is scaled linearly
      on the x-axis using xScalar defined above, and its timestamp is added as a data
      attribute for debugging purposes.
     */
    row.selectAll("circle")
       .data((observation, index) => { return entityData.obs[index]})
       .enter().append("circle")
       .attr("cx", (observation, index) => {
          let timestamp = new Date(data.timestamps[index]);
          return xScalar(timestamp.getTime()) + OFFSET
        })
       .attr("cy", ROW_HEIGHT / 1.5)
       .attr("r", (observation, index) => { return (observation[0] ? 1 : 0) + (observation[1] ? 1 : 0) })
       .attr("data-timestamp", (observation, index) => { return data.timestamps[index] })
  }

}
