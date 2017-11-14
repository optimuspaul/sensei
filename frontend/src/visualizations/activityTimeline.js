import * as d3 from "d3";
import {entityInflections} from './../constants';
import store from './../store/configureStore';
import {selectEntity} from './../actions/insightsActions';
import {startAndEndTimes, generateXScalar, calcChartHeight, segmentData, timelineTicks} from './utils';
import {entityRow, entityRowLabel, entityTypeSection, timeTicks} from './components';
import _ from 'lodash';

const rowHeight = 30; // how tall each row of data in timeline is
const offset = 205; // how far to the right the observation points start being drawn

export default function activityTimeline(data) {

  if (!data) return;

  let firstDay = _.toArray(data)[0];

  let color = d3.scaleOrdinal(d3.schemeCategory10).domain([0,3])

  document.querySelector("#visualization").innerHTML = "<svg></svg>";
  let zoom = _.get(store.getState(), "insights.ui.zoom") || 1;
  let chartWidth = 1260 * zoom; // how wide the width of the visualization is

   _.each(_.toArray(data), (day, dayIndex) => {

    let {startTime, endTime} = startAndEndTimes(day.timestamps);
    let chart = d3.select("#visualization svg")


    let xScalar = generateXScalar(startTime, endTime, chartWidth-offset);
    let ticks = timelineTicks(startTime, endTime, xScalar, zoom);

    let segmentedData = segmentData(day);

    let chartHeight = calcChartHeight(segmentedData);

    chart.attr("width", chartWidth)
      .attr("height", chartHeight + 20)
      .call(timeTicks, ticks, {offset, y: 10, zoom, id: 'top'})
      .call(timeTicks, ticks, {offset, y: chartHeight+20, zoom, hideLines: true})

    chart.selectAll(`g.segments`)
      .data(segmentedData)
      .call(entityTypeSection, {className: 'segments'})

    chart.selectAll("g.segments")
      .selectAll("g.row")
      .data(d => d[1].entities)
      .call(entityRow, 'row')


    chart.selectAll("g.row")
      .call(entityRowLabel)
      .selectAll("circle")
      .data((entity, index) => {
        return entity.obs;
      })
      .enter().append("circle")
      .attr("cx", (observation, index) => {
        let timestamp = new Date(day.timestamps[index]);
        return xScalar(timestamp.getTime()) + offset
      })
      .attr("style", function(d) { return `fill:${color(dayIndex)}`; })
      .attr("cy", rowHeight / 1.5)
      .attr("r", (observation, index) => { return (observation[0] ? 1 : 0) + (observation[1] ? 1 : 0) })

  });
}
