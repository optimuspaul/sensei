import * as d3 from "d3";
import {entityInflections} from './../constants';
import store from './../store/configureStore';
import {selectEntity} from './../actions/insightsActions';
import {startAndEndTimes, generateXScalar, calcChartHeight, segmentData, totalTimeTicks} from './utils';
import {entityRow, entityRowLabel, entityTypeSection, timeTicks} from './components';
import _ from 'lodash';


const rowHeight = 30; // how tall each row of data in timeline is
const offset = 100; // how far to the right the totals should start being drawn from
const boxWidth = 70;



export default function gridSummary(data) {

  document.querySelector("div#gridSummary svg").innerHTML = "";
  let vizElement = document.querySelector("#visualization #gridSummary");
  let chartElement = document.querySelector("#visualization");
  let chart = d3.select("#visualization div#gridSummary svg");

  let updateChart = (event) => {

    let data = event.detail
    if (_.isEmpty(data)) return;

    var t = d3.transition()
    .duration(750)
    .ease(d3.easeLinear);

    let state = store.getState();
    
    let zoom = 1;
    let interactionType = _.get(state, "insights.ui.interactionType");

    let segmentedData = _.map(data, (segment, key) => {
      let entityType = key.split('-')[0];
      let entityId = key.split('-')[1];
      let entity = _.get(state, `entities.${entityInflections[entityType]}.${entityId}`);
      
      return {entityId, entityType, entityName: entity.displayName, entities: segmentData(_.values(segment)[0])}
    });

    // let segmentedData = segmentData(data);
    

    // let entities = _.get(segmentedData, '0.1.entities');
    let entities = _.get(segmentedData, '0.entities.0.1.entities');
    let allObs = _.flatten(_.map(_.values(data), (entity) => {
      return _.values(entity)[0].obs
    }))
    let chartWidth = (boxWidth * _.size(entities)) + offset*2;
    let chartHeight = 200;
    let maxTotal = d3.max(allObs);
    let color = d3.scaleLinear().range(["white", "#666666"]).domain([0,maxTotal]);
    var xScalar = d3.scaleLinear().domain([0, maxTotal]).range([0, chartWidth-offset-100]);
    let ticks = totalTimeTicks(maxTotal, xScalar);
    
    

    chart.attr("width", chartWidth)
      .attr("height", chartHeight + 20)
      
    let row = chart.selectAll("g.row")
       .data(segmentedData)
    row.call(entityRow, {rowHeight: 70})
    row.call(entityRowLabel, {rowHeight: 70})

    let rect = row.selectAll("rect")
      .data((d) => {
          return _.get(d, 'entities.0.1.entities');
        })

    rect.exit().remove();

    rect.enter().append("rect")
      .merge(rect)
      .attr('width', boxWidth)
      .attr("x", (d, i) => { 
        return (i * boxWidth) + offset + 15
      })
      .attr('height', boxWidth)
      .attr("y", 20)
      .transition(t)
      .attr("style", function(d, i) {
        return `fill:${color(d.obs)};stroke: #f3f2f2`;
      })

    if (chart.select('g.header').empty()) {
      let header = chart.append("g").attr('class', 'header');
      let xLabels = header.selectAll("text.col-label")
        .data((d) => {
            return entities
          })
      xLabels.enter().append("text")
        .merge(xLabels)
        .attr("x", (d, i) => { 
          return (i * boxWidth) + offset + 15 + 35
        })
        .attr('class', 'col-label')
        .attr("y", 10)
        .text((d) => {
          return d.entityName;
        });
    }

  }

  vizElement.addEventListener('dataChanged',
    updateChart
  );
  updateChart({detail: data})

  return updateChart;

}