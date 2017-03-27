import * as d3 from "d3";
import {entityInflections} from './../constants';
import store from './../store/configureStore';
import _ from 'lodash';

const ROW_HEIGHT = 30; // how tall each row of data in timeline is
const STATIC_WIDTH = 1260; // how wide the width of the visualization is
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

  /*
    Initializes the template into the DOM
   */
  document.querySelector("#visualization").innerHTML = VISUALIZATION_TEMPLATE;

  /*
    Creates array of pairs that determine where the vertical timeline ticks
    are drawn and which hour label should be placed at the bottom of them to
    be fed into d3
   */
  let startTime = new Date(d3.min(data.timestamps));
  startTime.setMinutes(0);
  startTime.setSeconds(0);
  let endTime = new Date(d3.max(data.timestamps));
  endTime.setHours(endTime.getHours() + 2);
  endTime.setMinutes(0);
  endTime.setSeconds(0);
  let tmpTime = new Date(startTime.getTime());
  let ticks = []
  while (tmpTime < endTime) {
    ticks.push([tmpTime.getHours(), tmpTime.getTime()])
    tmpTime.setHours(tmpTime.getHours() + 1);
  }


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
    current[entityType].entities.push(entityName);
    current[entityType].y = current[entityType].y || index + _.size(current);
    return current;
  }, {});



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


  /*
    Initializes the chart with d3 using the STATIC_WIDTH constant defined above
    and the calculated chartHeight from above
   */
  let chart = d3.select("#visualization svg")
                  .attr("width", STATIC_WIDTH)
                  .attr("height", chartHeight);



  /*
    Adds the dashed time tick lines and their appropriate hour labels
    using the ticks data array created above and scaled using the linear
    scalar xScalar created above to ensure they stay within the SVG's width
   */
  let ticksContainer = chart.select('#ticks');

  ticksContainer.selectAll("line")
       .data(ticks)
       .enter().append("line")
       .attr("x1", (tick, index) => { return xScalar(tick[1]) + OFFSET + 15 })
       .attr("x2", (tick, index) => { return xScalar(tick[1]) + OFFSET + 15 })
       .attr("y1", 35)
       .attr("y2", chartHeight);

  ticksContainer.selectAll("text")
       .data(ticks)
       .enter().append("text")
       .attr("x", (tick, index) => { return xScalar(tick[1]) + OFFSET })
       .attr("y", 10)
       .text((tick, index) => { return parseInt(tick[0], 10) > 12 ? `${parseInt(tick[0], 10) - 12}:00pm` : `${tick[0]}:00${tick[0] === '12' ? 'pm' : 'am'}` })


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
        .text(function(entity) { return entity });

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
