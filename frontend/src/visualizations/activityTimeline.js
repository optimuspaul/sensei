import * as d3 from "d3";
import {entityInflections} from './../constants';
import store from './../store/configureStore';
import {selectEntity} from './../actions/insightsActions';
import {startAndEndTimes, generateXScalar, calcChartHeight, segmentData, timelineTicks} from './utils';
import {entityRow, entityRowLabel, entityTypeSection, timeTicks} from './components';
import _ from 'lodash';
import moment from 'moment';

const rowHeight = 30; // how tall each row of data in timeline is
const offset = 205; // how far to the right the observation points start being drawn
const TZO = (new Date()).getTimezoneOffset()*60*1000;

export default function activityTimeline(data) {

  document.querySelector("div#activityTimeline svg").innerHTML = "<g id='top-ticks' class='ticks'></g><g id='bottom-ticks' class='ticks'></g>";
  let vizElement = document.querySelector("#visualization #activityTimeline");
  let chartElement = document.querySelector("#visualization");
  let chart = d3.select("#visualization div#activityTimeline svg");
  let topTicks = chart.select("g#top-ticks");
  let bottomTicks = chart.select("g#bottom-ticks");

  let updateChart = (event) => {

    let data = event.detail

    if (!data) return;

    let color = d3.scaleOrdinal(d3.schemeCategory10).domain([0,_.size(data)-1])
    let zoom = _.get(store.getState(), "insights.ui.zoom") || 1;
    let chartWidth = 1260 * zoom; // how wide the width of the visualization is

    let {startTime, endTime} = startAndEndTimes(data.timestamps);
    startTime.setHours(7);
    endTime.setHours(17);

    let xScalar = generateXScalar(startTime, endTime, chartWidth-offset);
    let ticks = timelineTicks(startTime, endTime, xScalar, zoom);

    if (_.isEmpty(data.timestamps)) return;

    let segmentedData = segmentData(data);

    let chartHeight = calcChartHeight(segmentedData);

    var t = d3.transition()
    .duration(400)
    .ease(d3.easeLinear);

    chart.attr("width", chartWidth)
      .attr("height", chartHeight + 20)
      .selectAll("g.segments")
      .data(segmentedData)
      .call(entityTypeSection, {className: 'segments'})

    let row = chart.selectAll("g.segments")
    .selectAll("g.row")
    .data(d => d[1].entities || [])


    row.call(entityRow, 'row')
    row.call(entityRowLabel)

    let circle = row.selectAll("circle")
    .data((d) => {
      console.log("circle d: ", d)
      return d ? d.obs : [];
    })

    circle.exit().remove();

    circle.enter().append("circle")
    .merge(circle)
    .transition(t)
    .attr("cx", (observation, index) => {
      let timestamp = new Date(data.timestamps[index]);
      timestamp.setDate(startTime.getDate());
      timestamp.setMonth(startTime.getMonth());
      return xScalar(timestamp.getTime()+TZO) + offset
    })
    .attr("date", (observation, index) => {
      let timestamp = new Date(data.timestamps[index]);
      return timestamp.toISOString();
    })
    .attr("cy", rowHeight / 1.5)
    .attr("r", (observation, index) => { return ((observation[0] ? 1 : 0) + (observation[1] ? 1 : 0))*2 })

    topTicks.call(timeTicks, ticks, {offset, y: 10, zoom})
    bottomTicks.call(timeTicks, ticks, {offset, y: chartHeight+20, zoom, hideLines: true})


  }

  vizElement.addEventListener('dataChanged',
    updateChart
  );


  return updateChart;


}
