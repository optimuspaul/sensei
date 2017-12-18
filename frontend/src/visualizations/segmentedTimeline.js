import * as d3 from "d3";
import {entityInflections} from './../constants';
import store from './../store/configureStore';
import {startAndEndTimes, generateXScalar, calcChartHeight, segmentData, timelineTicks} from './utils';
import {entityRow, entityRowLabel, entityTypeSection, timeTicks} from './components';
import _ from 'lodash';

const rowHeight = 30; // how tall each row of data in timeline is
const offset = 205; // how far to the right the interaction segments should start being drawn from

const TZO = (new Date()).getTimezoneOffset()*60*1000;

/*
  plots the interaction segments for each entity within the current entity type group. The
  segments are based on a running average of radio observations between the current entity
  and any other given entity. Each segment is scaled linearly on the x-axis using xScalar
  defined above, and its timestamp is added as a data attribute for debugging purposes.
 */
export default function segmentedTimeline() {

  document.querySelector("div#segmentedTimeline svg").innerHTML = "<g id='top-ticks' class='ticks'></g><g id='bottom-ticks' class='ticks'></g>";
  let vizElement = document.querySelector("#visualization #segmentedTimeline");
  let chartElement = document.querySelector("#visualization");
  let chart = d3.select("#visualization div#segmentedTimeline svg");
  let topTicks = chart.select("g#top-ticks");
  let bottomTicks = chart.select("g#bottom-ticks");
  let color = d3.scaleOrdinal(d3.schemeCategory10).domain([0,5]);

  let updateChart = (event) => {

    let data = event.detail
    if (!data) return;

    var t = d3.transition()
    .duration(400)
    .ease(d3.easeLinear);



    let zoom = _.get(store.getState(), "insights.ui.zoom") || 1;
    let chartWidth = 1260 * zoom; // how wide the width of the visualization is
    let segmentedData = segmentData(data);
    let {startTime} = startAndEndTimes(data.timestamps);
    let endTime = new Date(startTime.getTime());
    startTime.setHours(7);
    endTime.setHours(17);
    let xScalar = generateXScalar(startTime, endTime, chartWidth-offset);
    let chartHeight = calcChartHeight(segmentedData);
    let ticks = timelineTicks(startTime, endTime, xScalar, zoom);
    let firstDate = startTime.getDate();

    chart.attr("width", chartWidth)
      .attr("height", chartHeight + 20)
      .selectAll("g.segments")
      .data(segmentedData)
      .call(entityTypeSection, {className: 'segments'})

    let row = chart.selectAll("g.segments")
      .selectAll("g.row")
      .data((d) => {
        return d[1].entities || [];
      })

    row.call(entityRow, 'row')
    row.call(entityRowLabel)

    let rect = row.selectAll("rect")
      .data((d) => {
        return d ? d.obs : [];
      })

    rect.exit().remove();

    rect.enter().append("rect")
      .merge(rect)
      .transition(t)
      .attr("x", (d) => {
        let timestamp = new Date(d[0]);
        timestamp.setDate(firstDate);
        return xScalar(timestamp.getTime()) + offset
      })
      .attr("style", function(d, i) {
        let startTimestamp = new Date(d[0]);
        let endTimestamp = new Date(d[1]);
        let colorIndex = endTimestamp.getDate() - firstDate
        return `fill:${color(colorIndex)};opacity:0.5;`;
      })
      .attr("date", function(d, i) {
        return `${d[0]} to ${d[1]}`;
      })
      .attr('width', (d) => {
        let startTimestamp = new Date(d[0]);
        startTimestamp.setDate(firstDate);
        let endTimestamp = new Date(d[1]);
        endTimestamp.setDate(firstDate);
        return xScalar(endTimestamp.getTime()) - xScalar(startTimestamp.getTime());
      })
      .attr('height', rowHeight*0.6)
      .attr("y", rowHeight*0.2)

      topTicks.call(timeTicks, ticks, {offset, y: 10, zoom, chartHeight})
      bottomTicks.call(timeTicks, ticks, {offset, y: chartHeight+20, zoom, hideLines: true})

  }

  vizElement.addEventListener('dataChanged',
    updateChart
  );


  return updateChart;


}
