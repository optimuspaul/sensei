import * as d3 from "d3";
import store from './../store/configureStore';
import {entityInflections} from './../constants';
import _ from 'lodash';

export default function activityTimeline(data) {

  let entities = store.getState().entities;

  let rowHeight = 30;
  let staticWidth = 800;
  let offset = 205;
  let entityBreaks = [];

  let entitiesWithHeaders = [];
  _.each(data.entities, (entity, index) => {
    if (index === 0 || entity[0] !== data.entities[index-1][0]) {
      return index+1
    }
  })

  let segmentedData = _.reduce(data.entities, (current, entity_data, index) => {
    let entityType = entityInflections[entity_data[0]];
    let entityId = entity_data[1];
    let entity = entities[entityType][entityId];
    let entityName = entity ? entity.displayName : "Unknown";
    current[entityType] = current[entityType] || {obs: [], entities: []};
    current[entityType].obs.push(data.obs[index]);
    current[entityType].entities.push(entities[entityType][entityId].displayName);
    current[entityType].y = current[entityType].y || index + _.size(current);
    return current;
  }, {});



  var xScalar = d3.scaleLinear()
    .domain([0, data.timestamps.length])
    .range([0, staticWidth-offset]);

  document.querySelector("#visualization").innerHTML = `
    <svg>
      <g id='ticks'></g>
      <g id='children' class='segments'></g>
      <g id='areas' class='segments'></g>
      <g id='materials' class='segments'></g>
      <g id='teachers' class='segments'></g>
    </svg>
  `;

  let chartHeight = rowHeight * (data.entities.length + _.size(segmentedData)) + 40;

  let chart = d3.select("#visualization svg")
                  .attr("width", staticWidth)
                  .attr("height", chartHeight);

  let startTime = new Date(d3.min(data.timestamps));

  let hours = parseInt(((new Date(d3.max(data.timestamps))).getTime()-startTime.getTime())/1000/60/60);

  let ticks = _.reduce(data.timestamps, (current, timestamp, index) => {
    let time = new Date(timestamp);
    current[time.getHours()] = current[time.getHours()] || index;
    return current;
  },{})

  // debugger
  let ticksContainer = chart.select('#ticks');
  ticksContainer.selectAll("line")
       .data(_.toPairs(ticks))
       .enter().append("line")
       .attr("x1", (tick, index) => { return tick[1] + offset })
       .attr("x2", (tick, index) => { return tick[1] + offset })
       .attr("y1", 20)
       .attr("y2", chartHeight - 30);

  ticksContainer.selectAll("text")
       .data(_.toPairs(ticks))
       .enter().append("text")
       .attr("x", (tick, index) => { return tick[1] + offset - 15 })
       .attr("y", chartHeight - 10)
       .text((tick, index) => { return parseInt(tick[0]) > 12 ? `${parseInt(tick[0]) - 12}:00pm` : `${tick[0]}:00am` })


  _.each(segmentedData, buildSection);

  function buildSection(entityData, entityType) {

    let section = chart.select(`#${entityType}`);
    section.attr("transform", "translate(0," + ((entityData.y * rowHeight)) + ")");

    section.append("text")
           .attr("x", 0)
           .attr("y", 0)
           .attr("style", "font-weight: bold")
           .text(entityType);


    let row = section.selectAll("g")
              .data(entityData.entities)
              .enter().append("g")
              .attr("transform", function(entity, index) { return "translate(0," + index * rowHeight + ")"; });


    row.append("text")
        .attr("x", 5)
        .attr("y", rowHeight / 1.5)
        .attr("dy", ".35em")
        .text(function(entity) { return entity });

    let observation = row.selectAll("circle")
                         .data((observation, index) => { return entityData.obs[index]})
                         .enter().append("circle")

    observation.attr("cx", (observation, index) => { return xScalar(index) + offset})
               .attr("cy", rowHeight / 1.5)
               .attr("r", (observation, index) => { return (observation[0] ? 1 : 0) + (observation[1] ? 1 : 0) });

  }

}
