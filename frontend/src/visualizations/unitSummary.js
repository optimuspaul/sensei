import * as d3 from "d3";
import {entityInflections} from './../constants';
import store from './../store/configureStore';
import {selectEntity} from './../actions/insightsActions';
import _ from 'lodash';

const ROW_HEIGHT = 30; // how tall each row of data in timeline is
const STATIC_WIDTH = 700; // how wide the width of the visualization is
const OFFSET = 100; // how far to the right the totals should start being drawn from
const VISUALIZATION_TEMPLATE = `
  <svg>
    <g id='ticks'></g>
    <g id='children' class='segments total'></g>
    <g id='areas' class='segments total'></g>
    <g id='materials' class='segments total'></g>
    <g id='teachers' class='segments total'></g>
  </svg>
`


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
  let maxTotal = d3.max(data.totals);
  while (seconds < maxTotal) {
    seconds += 600;
    ticks.push([seconds]);
  }

  let interactionType = _.get(store.getState(), "insights.ui.interactionType");

  /*
    Creates an object containing the data necessary for drawing the totals
    provided for each entity
   */
  let segmentedData = _.reduce(data.entities, (current, entity_data, index) => {
    let entityType = entityInflections[entity_data[0]];
    if (entityType !== interactionType) {
      return current
    }
    let entityId = entity_data[1];
    let entity = store.getState().entities[entityType][entityId];
    let entityName = entity ? entity.displayName : "Unknown";
    current[entityType] = current[entityType] || {totals: [], entities: []};
    current[entityType].totals.push(data.totals[index]);
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
    .domain([0, maxTotal])
    .range([0, STATIC_WIDTH-OFFSET]);

  /*
    Determines the height of the chart based on the number of entities included
    with the interaction total and the predetermined ROW_HEIGHT constant defined
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
                  .attr("height", chartHeight + 20);



  /*
    Adds the dashed time tick lines and their appropriate 10-minute increment labels
    using the ticks data array created above and scaled using the linear
    scalar xScalar created above to ensure they stay within the SVG's width
   */
  let ticksContainer = chart.select('#ticks');

  ticksContainer.selectAll("line")
       .data(ticks)
       .enter().append("line")
       .attr("x1", (tick, index) => { return xScalar(tick) + OFFSET + 15 })
       .attr("x2", (tick, index) => { return xScalar(tick) + OFFSET + 15 })
       .attr("y1", 20)
       .attr("y2", chartHeight);

  let ticksY = chartHeight+15;
  ticksContainer.selectAll(`text.y-${ticksY}`)
       .data(ticks)
       .enter().append(`text`)
       .attr('class', `y-${ticksY}`)
       .attr("x", (tick, index) => { return xScalar(tick) + OFFSET })
       .attr("y", ticksY)
       .text((tick, index) => { return `${tick/60} min` })

  // builds each entity type section using the segmentedData generated above
  _.each(segmentedData, buildSection);

  /*
    Builds each entity row in the timeline visualization by taking the entity data
    and entity type provided and creating a label and plotting the interaction totals using
    d3 and scaled linearly to fit the SVG's fixed width
   */
  function buildSection(entityData, entityType) {

    // selects group tag that corresponds to the current entity type
    let section = chart.select(`#${entityType}`);

    // sets the y displacement for the current entity type group
    section.attr("transform", "translate(0," + ((entityData.y * ROW_HEIGHT)) + ")");


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
        .text(function(entity) { return entity })
        .on('click', (entity) => {
          store.dispatch(selectEntity(entity.entityId, _.invert(entityInflections)[entity.entityType]))
        });

 

    /*
      plots the total for each entity within the current entity type group. The total 
      is scaled linearly on the x-axis using xScalar defined above, and its timestamp 
      is added as a data attribute for debugging purposes.
     */
    row.append("rect")
       .attr("x", () => {
          return OFFSET + 15;
        })
       .attr('width', (t, index) => {
          return xScalar(entityData.totals[index]);
        })
       .attr('height', ROW_HEIGHT*0.6)
       .attr("y", ROW_HEIGHT*0.3)
  }

}
