import * as d3 from "d3";
import {entityInflections} from './../constants';
import store from './../store/configureStore';
import {selectEntity} from './../actions/insightsActions';
import {startAndEndTimes, generateXScalar, calcChartHeight, segmentData, totalTimeTicks} from './utils';
import {entityRow, entityRowLabel, entityTypeSection, timeTicks} from './components';
import _ from 'lodash';

const rowHeight = 30; // how tall each row of data in timeline is
const chartWidth = 700; // how wide the width of the visualization is
const offset = 100; // how far to the right the totals should start being drawn from

export default function unitSummary(data) {

  if (!data) return;

  document.querySelector("#visualization").innerHTML = "<svg>";
  let zoom = _.get(store.getState(), "insights.ui.zoom") || 1;
  let chartWidth = 1260 * zoom; // how wide the width of the visualization is
  let interactionType = _.get(store.getState(), "insights.ui.interactionType");
  const entitiesToShow = {
    child: [interactionType],
    teacher: [interactionType],
    area: [interactionType],
    material:  [interactionType]
  }
  let segmentedData = segmentData(data, entitiesToShow);
  let maxTotal = d3.max(data.obs);
  let {startTime, endTime} = startAndEndTimes(data.timestamps);
  var xScalar = d3.scaleLinear().domain([0, maxTotal]).range([0, chartWidth-offset-100]);
  let ticks = totalTimeTicks(maxTotal, xScalar);
  let chartHeight = calcChartHeight(segmentedData);

  

  let chart = d3.select("#visualization svg")

  chart.attr("width", chartWidth)
    .attr("height", chartHeight + 20)
    .call(timeTicks, ticks, {offset, y: 10, zoom, id: 'top'})
    .call(timeTicks, ticks, {offset, y: chartHeight+20, zoom, hideLines: true})
    .selectAll("g.segments")
    .data(segmentedData)
    .call(entityTypeSection, {className: 'segments', hideLabels: true})

  chart.selectAll("g.segments")
    .selectAll("g.row")
    .data(d => d[1].entities)
    .call(entityRow, 'row')

  chart.selectAll("g.row")
    .call(entityRowLabel)
    .append("rect")
    .attr("x", offset + 15)
    .attr('width', (d) => {
      return xScalar(d.obs);
    })
    .attr('height', rowHeight*0.6)
    .attr("y", rowHeight*0.3)

}