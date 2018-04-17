import * as d3 from "d3";
import {entityInflections} from './../constants';
import store from './../store/configureStore';
import {selectEntity} from './../actions/insightsActions';
import {startAndEndTimes, generateXScalar, calcChartHeight, segmentData, timelineTicks} from './utils';
import {entityRow, entityRowLabel, entityTypeSection, timeTicks} from './components';
import _ from 'lodash';
import moment from 'moment';

const rowHeight = 30; // how tall each row of data in timeline is
const offset = 150; // how far to the right the observation points start being drawn

export default function activityTimeline(data) {

  document.querySelector("div#activityTimeline").innerHTML = "<div class='fixed-label-chart'><svg class='chart-labels'></svg><div class='chart-container'><svg class='chart'><g id='top-ticks' class='ticks'></g><g id='bottom-ticks' class='ticks'></g></svg></div></div>";
  let vizElement = document.querySelector("#visualization #activityTimeline");
  let labels = d3.select("#visualization div#activityTimeline svg.chart-labels");
  let chartElement = document.querySelector("#visualization");
  let chartContainer = document.querySelector("#activityTimeline .chart-container");
  let chart = d3.select("#visualization div#activityTimeline svg.chart");
  let topTicks = chart.select("g#top-ticks");
  let bottomTicks = chart.select("g#bottom-ticks");
  let color = d3.scaleOrdinal(d3.schemeCategory10).domain([0,_.size(data)-1])

  let updateChart = (event) => {

    let data = event.detail
    if (!data || _.isEmpty(data.timestamps)) return;

    let zoom = _.get(store.getState(), "insights.ui.zoom", 1);
    chartContainer.style.marginLeft = `${offset}px`;
    chartContainer.style.width = `calc(100% - ${offset}px)`
    let t = d3.transition().duration(400).ease(d3.easeLinear);
    let chartWidth = 1260 * zoom; // how wide the width of the visualization is
    let segmentedData = segmentData(data);
    let {startTime, endTime} = startAndEndTimes(data.timestamps);

    startTime.setHours(7);
    endTime.setHours(17);
    let xScalar = generateXScalar(startTime, endTime, chartWidth);
    let chartHeight = calcChartHeight(segmentedData);
    let ticks = timelineTicks(startTime, endTime, xScalar, zoom);


    labels.attr("width", offset)
      .attr("height", chartHeight + 20)
      .selectAll("g.segments")
      .data(segmentedData)
      .call(entityTypeSection, {className: 'segments'})

    let labelRow = labels.selectAll("g.segments")
      .selectAll("g.row")
      .data((d) => {
        return d[1].entities || [];
      })

    labelRow.call(entityRow, 'row')
    labelRow.call(entityRowLabel)

    chart.attr("width", chartWidth)
      .attr("height", chartHeight + 20)
      .selectAll("g.segments")
      .data(segmentedData)
      .call(entityTypeSection, {className: 'segments', labels: false})

    let row = chart.selectAll("g.segments")
    .selectAll("g.row")
    .data(d => d[1].entities || [])


    row.call(entityRow, 'row')

    let circle = row.selectAll("circle")
    .data((d) => {
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
      return xScalar(timestamp.getTime())
    })
    .attr("date", (observation, index) => {
      let timestamp = new Date(data.timestamps[index]);
      return timestamp.toISOString();
    })
    .attr("cy", rowHeight / 1.5)
    .attr("r", (observation, index) => { return ((observation[0] ? 1 : 0) + (observation[1] ? 1 : 0))*2 })

    topTicks.call(timeTicks, ticks, {offset:0, y: 10, zoom, chartHeight})
    bottomTicks.call(timeTicks, ticks, {offset:0, y: chartHeight+20, zoom, hideLines: true})


  }

  vizElement.addEventListener('dataChanged',
    updateChart
  );


  return updateChart;


}
