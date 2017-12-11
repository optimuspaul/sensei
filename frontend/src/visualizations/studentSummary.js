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

  document.querySelector("div#studentSummary svg").innerHTML = VISUALIZATION_TEMPLATE;
  let vizElement = document.querySelector("#visualization #studentSummary");
  let chartElement = document.querySelector("#visualization");
  let chart = d3.select("#visualization div#studentSummary svg");

  let updateChart = (event) => {
    
    let data = event.detail
    if (!data) {
      return
    }

    _.forEach(_.orderBy(_.zip(data.obs, data.entities), '0', 'desc'), (pair, index) => { data.entities[index] = pair[1]; data.obs[index] = pair[0]; });
    


    /*
      Creates array of pairs that determine where the vertical percentage ticks
      are drawn and which percentage label should be placed to the right of them to
      be fed into d3
     */

    let ticks = _.reduce(_.times(10),(c,n) => {return _.concat(c,(n+1)*10)}, []);

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
      current[entityType].totals.push(data.obs[index]);
      current[entityType].entities.push(entityName);
      return current;
    }, {});
    let summedTotals = _.map(segmentedData, (group) => {
      return _.sum(group.totals);
    });

    let maxTotal = d3.max(summedTotals);

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
    let chartWidth = (ROW_WIDTH * _.size(segmentedData)) + OFFSET*2;


    /*
      Initializes the chart with d3 using the STATIC_HEIGHT constant defined above
      and the calculated chartWidth from above
     */
    
    chart.attr("height", STATIC_HEIGHT)
         .attr("width", chartWidth + 20);


    chart.append("line")
         .attr("y1", 0)
         .attr("y2", STATIC_HEIGHT - 25)
         .attr("x1", OFFSET + 10)
         .attr("x2", OFFSET + 10)
         .attr('class', 'y axis');

    chart.append("line")
         .attr("y1", STATIC_HEIGHT - 25)
         .attr("y2", STATIC_HEIGHT - 25)
         .attr("x1", OFFSET + 10)
         .attr("x2", chartWidth + OFFSET)
         .attr('class', 'x axis');
    /*
      Adds the dashed time tick lines and their appropriate 10-minute increment labels
      using the ticks data array created above and scaled using the linear
      scalar yScalar created above to ensure they stay within the SVG's width
     */
    let ticksContainer = chart.select('#ticks');

    ticksContainer.selectAll("line")
         .data(ticks)
         .enter().append("line")
         .attr("y1", (tick, index) => { return STATIC_HEIGHT - yScalar((tick/100)*maxTotal) - OFFSET + 15})
         .attr("y2", (tick, index) => { return STATIC_HEIGHT - yScalar((tick/100)*maxTotal) - OFFSET + 15})
         .attr("x1", OFFSET + 10)
         .attr("x2", chartWidth + OFFSET);

    ticksContainer.selectAll(`text.x-10`)
         .data(ticks)
         .enter().append(`text`)
         .attr('class', `x-10`)
         .attr("y", (tick, index) => { return STATIC_HEIGHT - yScalar((tick/100)*maxTotal) - OFFSET + 20 })
         .attr("x", 0)
         .text((tick, index) => { return `${tick}%` });

    // builds each entity type section using the segmentedData generated above
    let i = 0;
    _.each(segmentedData, (entityData, entityType) => { buildSection(entityData, entityType, i++) });

    /*
      Builds each entity row in the timeline visualization by taking the entity data
      and entity type provided and creating a label and plotting the interaction totals using
      d3 and scaled linearly to fit the SVG's fixed width
     */
    function buildSection(entityData, entityType, i) {
      let totalSeconds = _.sum(entityData.totals);
      let timeText = generateTimeText(totalSeconds)

      // selects group tag that corresponds to the current entity type
      let section = chart.select(`#${entityType}`);

      // sets the y displacement for the current entity type group
      section.attr("transform", "translate(" + (((i) * ROW_WIDTH)) + ",0)");

      // adds the entity type label for the current entity group
      section.append("text")
             .attr("y", STATIC_HEIGHT)
             .attr("x", ROW_WIDTH/2 + 20 + OFFSET)
             .attr("style", "font-weight: bold")
             .text(entityType);

      section.append("text")
             .attr("y", 10)
             .attr("x", ROW_WIDTH/2 + 20 + OFFSET)
             .attr("style", "font-weight: bold; font-size: 12px;")
             .text(timeText.text);

      /*
        adds a row for each entity included in the current entity type group and sets
        its correct y displacement
       */
      let row = section.selectAll("g")
                .data(entityData.entities)
                .enter().append("g")


      /*
        plots the total for each entity within the current entity type group. The total 
        is scaled linearly on the x-axis using yScalar defined above, and its timestamp 
        is added as a data attribute for debugging purposes.
       */
      
      let myYScalar = d3.scaleLinear()
      .domain([0, totalSeconds])
      .range([0, STATIC_HEIGHT-OFFSET]);

      row.append("rect")
         .attr("y", (t, index) => {
            let prevTotal = _.sum(entityData.totals.slice(0,index));
            let prevY = prevTotal ? myYScalar(prevTotal) : 0;
            let y = myYScalar(entityData.totals[index]) + prevY
            return STATIC_HEIGHT - y - (OFFSET - 15);
          })
         .attr('height', (t, index) => {
            return myYScalar(entityData.totals[index]);
          })
         .attr('width', ROW_WIDTH*0.8)
         .attr("x", ROW_WIDTH*0.2 + OFFSET)

      // // adds the entity display names as labels for each entity row within the current group

      row.append("text")
          .attr("y", (t, i) => { return calcEntityTextY(t,i)})
          .attr("x", ROW_WIDTH/2 + 20 + OFFSET)
          .text(function(entity, index) { 
            return entity 
          })
          .attr('text-anchor', 'middle')
          .attr("class", (t, index) => {
            return myYScalar(entityData.totals[index]) < 30 ? 'show-on-hover' : ''
          })
          .on('click', (entity) => {
            store.dispatch(selectEntity(entity.entityId, _.invert(entityInflections)[entity.entityType]))
          });
      row.append("text")
          .attr("y", (t, i) => { return calcEntityTextY(t,i) + 15 })
          .attr("x", ROW_WIDTH/2 + 20 + OFFSET)
          .text(function(entity, index) { 
            return generateTimeText(entityData.totals[index]).text;
          })
          .attr('text-anchor', 'middle')
          .attr("class", (t, index) => {
            return myYScalar(entityData.totals[index]) < 30 ? 'show-on-hover' : ''
          })
          .on('click', (entity) => {
            store.dispatch(selectEntity(entity.entityId, _.invert(entityInflections)[entity.entityType]))
          })


   
      function calcEntityTextY(t, index) {
        let prevTotal = _.sum(entityData.totals.slice(0,index));
        let prevY = prevTotal ? myYScalar(prevTotal) : 0;
        let y = myYScalar(entityData.totals[index])
        let newTotal = y + prevY
        return STATIC_HEIGHT - (newTotal-(y/2)) - (OFFSET - 10);
      }

    }

    function generateTimeText(totalSeconds) {
      let data = {}
      data.totalMinutes = parseInt(totalSeconds/60);
      data.totalHours = parseInt(data.totalMinutes/60);
      data.remainderMinutes = data.totalMinutes%60;
      data.text = '';
      if (data.totalHours > 0) {
        data.text += `${data.totalHours} hour${data.totalHours > 1 ? 's' : ''}, `
      }
      if (data.totalMinutes > 0) {
        data.text += `${data.remainderMinutes} minute${data.remainderMinutes > 1 ? 's' : ''}`;
      } else {
        data.text = `less than a minute`;
      }
      return data;
    }
  }

  vizElement.addEventListener('dataChanged',
    updateChart
  );


  return updateChart;

}
