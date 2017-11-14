import * as d3 from "d3";
import {entityInflections} from './../constants';
import store from './../store/configureStore';
import {startAndEndTimes, generateXScalar, calcChartHeight, segmentData, timelineTicks} from './utils';
import {entityRow, entityRowLabel, entityTypeSection, timeTicks} from './components';
import _ from 'lodash';

const rowHeight = 30; // how tall each row of data in timeline is
const offset = 205; // how far to the right the interaction segments should start being drawn from

/*
  plots the interaction segments for each entity within the current entity type group. The
  segments are based on a running average of radio observations between the current entity
  and any other given entity. Each segment is scaled linearly on the x-axis using xScalar
  defined above, and its timestamp is added as a data attribute for debugging purposes.
 */
export default function segmentedTimeline(data) {

  if (!data) return;

  document.querySelector("#visualization").innerHTML = "<svg>";
  let zoom = _.get(store.getState(), "insights.ui.zoom") || 1;
  let chartWidth = 1260 * zoom; // how wide the width of the visualization is
  let segmentedData = segmentData(data);
  let {startTime, endTime} = startAndEndTimes(data.timestamps);
  let xScalar = generateXScalar(startTime, endTime, chartWidth-offset);
  let chartHeight = calcChartHeight(segmentedData);
  let ticks = timelineTicks(startTime, endTime, xScalar, zoom);
  let chart = d3.select("#visualization svg")

  console.log("segmentedData", segmentedData)

  chart.attr("width", chartWidth)
    .attr("height", chartHeight + 20)
    .call(timeTicks, startTime, endTime, {offset, y: 10, zoom, id: 'top'})
    .call(timeTicks, startTime, endTime, {offset, y: chartHeight+20, zoom, hideLines: true})
    .selectAll("g.segments")
    .data(segmentedData)
    .call(entityTypeSection, {className: 'segments'})

  chart.selectAll("g.segments")
    .selectAll("g.row")
    .data(d => d[1].entities || [])
    .call(entityRow, 'row')

  chart.selectAll("g.row")
    .call(entityRowLabel)
    .selectAll("rect")
    .data(d => d.obs)
    .enter().append("rect")
    .attr("x", (d) => {
      let timestamp = new Date(d[0]);
      return xScalar(timestamp.getTime()) + offset
    })
    .attr('width', (d) => {
      let startTimestamp = new Date(d[0]);
      let endTimestamp = new Date(d[1]);
      return xScalar(endTimestamp.getTime()) - xScalar(startTimestamp.getTime());
    })
    .attr('height', rowHeight*0.6)
    .attr("y", rowHeight*0.2)


}
