import * as d3 from "d3";
import {entityInflections} from './../constants';
import store from './../store/configureStore';
import {selectEntity} from './../actions/insightsActions';
import _ from 'lodash';

const ROW_WIDTH = 200; // how tall each row of data in timeline is
const STATIC_HEIGHT = 450; // how wide the width of the visualization is
const OFFSET = 40; // how far to the right the totals should start being drawn from
const VISUALIZATION_TEMPLATE = `
  <svg class='student-summary'>
    <g id='ticks'></g>
    <g id='children' class='segments total'></g>
    <g id='areas' class='segments total'></g>
    <g id='materials' class='segments total'></g>
    <g id='teachers' class='segments total'></g>
  </svg>
`
const ENTITIES_TO_SHOW = {
  child: ['children', 'areas', 'materials', 'teachers'],
  teacher: ['children', 'areas'],
  area: ['children', 'teachers'],
  material:  ['children']
}

export default function interactionTotals(data) {

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
  let ticks = [0];
  let seconds = 0;


  let currentEntityType = _.get(store.getState(), "insights.ui.currentEntityType");

  /*
    Creates an object containing the data necessary for drawing the totals
    provided for each entity
   */
  let segmentedData = _.reduce(data.entities, (current, entity_data, index) => {
    let entityType = entityInflections[entity_data[0]];
    if (!_.includes(ENTITIES_TO_SHOW[currentEntityType], entityType)) {
      return current
    }
    let entityId = entity_data[1];
    let entity = store.getState().entities[entityType][entityId];
    let entityName = entity ? entity.displayName : "Unknown";
    current[entityType] = current[entityType] || {totals: [], entities: []};
    current[entityType].totals.push(data.totals[index]);
    current[entityType].entities.push(entityName);
    return current;
  }, {});
  let summedTotals = _.map(segmentedData, (group) => {
    return _.sum(group.totals);
  });

  let maxTotal = d3.max(summedTotals);
  while (seconds < maxTotal) {
    seconds += 600;
    ticks.push([seconds]);
  }

  /*
    Creates a scalar on the x axis that constrains all values to the
    fixed width of the visualization, specified by the STATIC_HEIGHT
    constant defined above
   */
  var yScalar = d3.scaleLinear()
    .domain([0, maxTotal])
    .range([0, STATIC_HEIGHT-OFFSET]);

  /*
    Determines the height of the chart based on the number of entities included
    with the interaction total and the predetermined ROW_WIDTH constant defined
    above, with an extra ROW_WIDTH's worth of space added to the bottom to make
    space for the time tick labels
   */
  let chartWidth = (ROW_WIDTH * _.size(segmentedData));


  /*
    Initializes the chart with d3 using the STATIC_HEIGHT constant defined above
    and the calculated chartWidth from above
   */
  let chart = d3.select("#visualization svg")
                  .attr("height", STATIC_HEIGHT)
                  .attr("width", chartWidth + 20);



  /*
    Adds the dashed time tick lines and their appropriate 10-minute increment labels
    using the ticks data array created above and scaled using the linear
    scalar yScalar created above to ensure they stay within the SVG's width
   */
  let ticksContainer = chart.select('#ticks');

  ticksContainer.selectAll("line")
       .data(ticks)
       .enter().append("line")
       .attr("y1", (tick, index) => { return STATIC_HEIGHT - yScalar(tick) - OFFSET - 15 })
       .attr("y2", (tick, index) => { return STATIC_HEIGHT - yScalar(tick) - OFFSET - 15 })
       .attr("x1", 20)
       .attr("x2", chartWidth);

  [10, chartWidth+15].forEach((x) => {
    ticksContainer.selectAll(`text.x-${x}`)
         .data(ticks)
         .enter().append(`text`)
         .attr('class', `x-${x}`)
         .attr("y", (tick, index) => { return STATIC_HEIGHT - yScalar(tick) - OFFSET })
         .attr("x", x)
         .text((tick, index) => { return `${tick/60} min` })
  });

  // builds each entity type section using the segmentedData generated above
  let i = 0;
  _.each(segmentedData, (entityData, entityType) => { buildSection(entityData, entityType, i++) });

  /*
    Builds each entity row in the timeline visualization by taking the entity data
    and entity type provided and creating a label and plotting the interaction totals using
    d3 and scaled linearly to fit the SVG's fixed width
   */
  function buildSection(entityData, entityType, i) {

    // selects group tag that corresponds to the current entity type
    let section = chart.select(`#${entityType}`);

    // sets the y displacement for the current entity type group
    section.attr("transform", "translate(" + (((i) * ROW_WIDTH)) + ",0)");

    // adds the entity type label for the current entity group
    section.append("text")
           .attr("y", STATIC_HEIGHT)
           .attr("x", ROW_WIDTH/2)
           .attr("style", "font-weight: bold")
           .text(entityType);

    /*
      adds a row for each entity included in the current entity type group and sets
      its correct y displacement
     */
    let row = section.selectAll("g")
              .data(entityData.entities)
              .enter().append("g")
              // .attr("transform", function(entity, index) { 
              //   return "translate(" + ((index * ROW_WIDTH)) + ",0)"; 
              // });


    /*
      plots the total for each entity within the current entity type group. The total 
      is scaled linearly on the x-axis using yScalar defined above, and its timestamp 
      is added as a data attribute for debugging purposes.
     */
    row.append("rect")
       .attr("y", (t, index) => {
          let prevTotal = _.sum(entityData.totals.slice(0,index));
          let prevY = prevTotal ? yScalar(prevTotal) : 0;
          let y = yScalar(entityData.totals[index]) + prevY
          return STATIC_HEIGHT - y - (OFFSET - 15);
        })
       .attr('height', (t, index) => {
          return yScalar(entityData.totals[index]);
        })
       .attr('width', ROW_WIDTH*0.6)
       .attr("x", ROW_WIDTH*0.3)

    // // adds the entity display names as labels for each entity row within the current group
    row.append("text")
        .attr("y", (t, index) => {
          let prevTotal = _.sum(entityData.totals.slice(0,index));
          let prevY = prevTotal ? yScalar(prevTotal) : 0;
          let y = yScalar(entityData.totals[index])
          let newTotal = y + prevY
          return STATIC_HEIGHT - (newTotal-(y/2)) - (OFFSET - 15);
        })
        .attr("x", ROW_WIDTH/2)
        .text(function(entity) { return entity })
        .on('click', (entity) => {
          store.dispatch(selectEntity(entity.entityId, _.invert(entityInflections)[entity.entityType]))
        });

 


  }

}
