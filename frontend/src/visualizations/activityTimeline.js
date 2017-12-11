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

export default function activityTimeline(data) {

  document.querySelector("div#activityTimeline svg").innerHTML = "<g id='top-ticks' class='ticks'></g><g id='bottom-ticks' class='ticks'></g>";
  let vizElement = document.querySelector("#visualization #activityTimeline");
  let chartElement = document.querySelector("#visualization");
  let chart = d3.select("#visualization div#activityTimeline svg");
  let topTicks = chart.select("g#top-ticks");
  let bottomTicks = chart.select("g#bottom-ticks");

  let updateChart = (event) => {

    let data = event.detail
    data = _.filter(_.toArray(data), (day) => {
      return !_.isEmpty(day.timestamps)
    });

    if (_.isEmpty(data)) return;

    let firstDay = data[0];
    let color = d3.scaleOrdinal(d3.schemeCategory10).domain([0,_.size(data)-1])
    let zoom = _.get(store.getState(), "insights.ui.zoom") || 1;
    let chartWidth = 1260 * zoom; // how wide the width of the visualization is

    let startTime = new Date();
    startTime.setMinutes(0);
    startTime.setSeconds(0);
    startTime.setHours(7);

    let endTime = new Date();
    endTime.setMinutes(0);
    endTime.setSeconds(0);
    endTime.setHours(17);

    let xScalar = generateXScalar(startTime, endTime, chartWidth-offset);
    let ticks = timelineTicks(startTime, endTime, xScalar, zoom);

     _.each(data, (day, index) => {

      // let {startTime, endTime} = startAndEndTimes(day.timestamps);
      
      if (_.isEmpty(day.timestamps)) return;

      let segmentedData = segmentData(day);

      let chartHeight = calcChartHeight(segmentedData);

      if (index === 0) {
        chart.attr("width", chartWidth)
          .attr("height", chartHeight + 20)
          .call(timeTicks, ticks, {offset, y: 10, zoom, id: 'top'})
          .call(timeTicks, ticks, {offset, y: chartHeight+20, zoom, hideLines: true})
      }
      
      chart.selectAll(`g.segments`)
        .data(segmentedData)
        .call(entityTypeSection, {className: 'segments'})

      chart.selectAll("g.segments")
        .selectAll("g.row")
        .data(d => d[1].entities)
        .call(entityRow, 'row')


      chart.selectAll("g.row")
        .call(entityRowLabel)
        .selectAll(`circle.day-${index}`)
        .data((entity, index) => {
          return entity.obs;
        })
        .enter().append("circle")
        .attr("cx", (observation, index) => {
          let timestamp = new Date(day.timestamps[index]);
          timestamp.setDate(startTime.getDate());
          timestamp.setMonth(startTime.getMonth());
          return xScalar(timestamp.getTime()) + offset
        })
        .attr("style", function(d, i) { return `fill:${color(index)};opacity:0.05;`; })
        .attr("class", `day-${index}`)
        .attr("date", (observation, index) => {
          let timestamp = new Date(day.timestamps[index]);
          timestamp.setDate(startTime.getDate());
          timestamp.setMonth(startTime.getMonth());
          return timestamp.toISOString();
        })
        .attr("cy", rowHeight / 1.5)
        .attr("r", (observation, index) => { return ((observation[0] ? 1 : 0) + (observation[1] ? 1 : 0))*3 })

        topTicks.call(timeTicks, ticks, {offset, y: 10, zoom})
      bottomTicks.call(timeTicks, ticks, {offset, y: chartHeight+20, zoom, hideLines: true})

    });

  }

  vizElement.addEventListener('dataChanged',
    updateChart
  );


  return updateChart;


}
