import * as d3 from "d3";
import {entityInflections} from './../constants';
import store from './../store/configureStore';
import timeTicks from './timeTicks';
import {startAndEndTimes, generateXScalar, calcChartHeight} from './utils';
import entityTypeSection from './entityTypeSection';
import entityRow from './entityRow';
import entityRowLabel from './entityRowLabel';
import segmentData from './segmentData';
import _ from 'lodash';

const rowHeight = 30; // how tall each row of data in timeline is
const offset = 205; // how far to the right the interaction segments should start being drawn from

const entitiesToShow = {
  child: ['children', 'areas', 'materials', 'teachers'],
  teacher: ['children', 'areas'],
  area: ['children', 'teachers'],
  material:  ['children']
}

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
  let segmentedData = segmentData(data, entitiesToShow);
  let {startTime, endTime} = startAndEndTimes(data.timestamps);
  let xScalar = generateXScalar(startTime, endTime, chartWidth-offset);
  let chartHeight = calcChartHeight(segmentedData);

  let chart = d3.select("#visualization svg")

  chart.attr("width", chartWidth)
    .attr("height", chartHeight + 20)
    .call(timeTicks, startTime, endTime, xScalar, {offset, y: 10, zoom, id: 'top'})
    .call(timeTicks, startTime, endTime, xScalar, {offset, y: chartHeight+20, zoom, hideLines: true})
    .selectAll("g.segments")
    .data(segmentedData)
    .call(entityTypeSection, {className: 'segments'})

  chart.selectAll("g.segments")
    .selectAll("g.row")
    .data(d => d[1].entities)
    .call(entityRow, 'row')

  chart.selectAll("g.row")
    .call(entityRowLabel)
    .selectAll("rect")
    .data((entity, index) => {
      return entity.obs;
    })
    .enter().append("rect")
    .attr("x", (observation, index) => {
      let timestamp = new Date(observation[0]);
      return xScalar(timestamp.getTime()) + offset
    })
    .attr('width', (observation, index) => {
      let startTimestamp = new Date(observation[0]);
      let endTimestamp = new Date(observation[1]);
      return xScalar(endTimestamp.getTime()) - xScalar(startTimestamp.getTime());
    })
    .attr('height', rowHeight*0.6)
    .attr("y", rowHeight*0.2)


}
