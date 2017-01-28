
import * as d3 from "d3";
import store from './../store/configureStore';
import {entityInflections} from './../constants';

export default function activityTimeline(data) {

  let entities = store.getState().entities;

  let rowHeight = 40;
  let staticWidth = 800;

  var xScalar = d3.scaleLinear()
    .domain([0, data.timestamps.length])
    .range([0, staticWidth-100]);

  document.querySelector("#visualization").innerHTML = '<svg></svg>';

  let chart = d3.select("#visualization svg")
                .attr("width", staticWidth)
                .attr("height", rowHeight * data.entities.length + 40);

  let row = chart.selectAll("g")
            .data(data.entities)
            .enter().append("g")
            .attr("transform", function(entity, index) { return "translate(0," + index * rowHeight + ")"; });


  row.append("line")
    .attr("x1", 0)
    .attr("x2", staticWidth)
    .attr("y1", rowHeight)
    .attr("y2", rowHeight);

  row.append("text")
      .attr("x", 0)
      .attr("y", rowHeight / 2)
      .attr("dy", ".35em")
      .text(function(entity) { return `${entities[entityInflections[entity[0]]][entity[1]].displayName}`; });

  let observation = row.selectAll("circle")
                       .data((observation, index) => { return data.obs[index]})
                       .enter().append("circle")

  observation.attr("cx", (observation, index) => { return xScalar(index) + 100})
             .attr("cy", rowHeight / 2)
             .attr("r", (observation, index) => { return (observation[0] ? 1 : 0) + (observation[1] ? 1 : 0) });


}
