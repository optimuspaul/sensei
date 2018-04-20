import * as d3 from "d3";
import {entityInflections} from './../constants';
import store from './../store/configureStore';
import {startAndEndTimes, generateXScalar, calcChartHeight, segmentData, timelineTicks} from './utils';
import {entityRow, entityRowLabel, entityTypeSection, timeTicks} from './components';
import _ from 'lodash';

const rowHeight = 30; // how tall each row of data in timeline is
const offset = 150; // how far to the right the interaction segments should start being drawn from

const ENTITIES_TO_SHOW = {
  child: ['children','materials', 'teachers'],
  teacher: ['children', 'areas'],
  area: ['children', 'teachers'],
  material:  ['children']
}

const TZO = (new Date()).getTimezoneOffset()*60*1000;

/*
  plots the interaction segments for each entity within the current entity type group. The
  segments are based on a running average of radio observations between the current entity
  and any other given entity. Each segment is scaled linearly on the x-axis using xScalar
  defined above, and its timestamp is added as a data attribute for debugging purposes.
 */
export default function segmentedTimeline() {

  document.querySelector("div#segmentedTimeline").innerHTML = "<div class='fixed-label-chart'><svg class='chart-labels'></svg><div class='chart-container'><svg class='chart'><g id='top-ticks' class='ticks'></g><g id='bottom-ticks' class='ticks'></g></svg></div></div>";
  let vizElement = document.querySelector("#visualization #segmentedTimeline");
  let labels = d3.select("#visualization div#segmentedTimeline svg.chart-labels");
  let chartElement = document.querySelector("#visualization");
  let chartContainer = document.querySelector("div#segmentedTimeline .chart-container");
  let chart = d3.select("#visualization div#segmentedTimeline svg.chart");
  let topTicks = chart.select("g#top-ticks");
  let bottomTicks = chart.select("g#bottom-ticks");
  let color = d3.scaleOrdinal(d3.schemeCategory10).domain([0,5]);

  let updateChart = (event) => {

    let data = event.detail
    if (!data) return;
    data = transformIps(data);
    let zoom = _.get(store.getState(), "insights.ui.zoom", 1);
    chartContainer.style.marginLeft = `${offset}px`;
    chartContainer.style.width = `calc(100% - ${offset}px)`
    let t = d3.transition().duration(400).ease(d3.easeLinear);
    let chartWidth = 1260 * zoom; // how wide the width of the visualization is
    let segmentedData = segmentData(data, ENTITIES_TO_SHOW);
    let {startTime} = startAndEndTimes(data.timestamps);
    let endTime = new Date(startTime.getTime());
    startTime.setHours(7);
    endTime.setHours(17);
    let xScalar = generateXScalar(startTime, endTime, chartWidth);
    let chartHeight = calcChartHeight(segmentedData);
    let ticks = timelineTicks(startTime, endTime, xScalar, zoom);
    let firstDate = startTime.getDate();

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
      .data((d) => {
        return d[1].entities || [];
      })

    row.call(entityRow, 'row')

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
        return xScalar(timestamp.getTime())
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
        let width = xScalar(endTimestamp.getTime()) - xScalar(startTimestamp.getTime());
        return width > 0 ? width : 0;
      })
      .attr('height', rowHeight*0.6)
      .attr("y", rowHeight*0.2)

      topTicks.call(timeTicks, ticks, {y: 10, zoom, chartHeight, offset: 0})
      bottomTicks.call(timeTicks, ticks, {y: chartHeight+20, zoom, hideLines: true, offset: 0})

  }

  function transformIps(ips) {
    return _.reduce(_.orderBy(ips, ['targetEntityType'], ['desc']), (current, ip) => {
      let index = _.findIndex(current.entities, (entity) => {
        return entity[0] === ip.targetEntityType && entity[1] === ip.targetEntityId;
      })
      if (index === -1) {
        current.entities.push([ip.targetEntityType, ip.targetEntityId])
        index = _.size(current.entities)-1;
      }
      current.obs[index] = current.obs[index] || [];
      current.obs[index].push([ip.startTime.toISOString(), ip.endTime.toISOString()])
      if(current.timestamps[0]) {
        let earliestTimestamp = new Date(current.timestamps[0]);
        current.timestamps[0] = earliestTimestamp > ip.startTime ? ip.startTime.toISOString() : current.timestamps[0];
      } else {
        current.timestamps[0] = ip.startTime.toISOString();
      }
      if(current.timestamps[1]) {
        let latestTimestamp = new Date(current.timestamps[1]);
        current.timestamps[1] = latestTimestamp > ip.endTime ? ip.endTime.toISOString() : current.timestamps[1];
      } else {
        current.timestamps[1] = ip.endTime.toISOString();
      }
      return current;
    }, {entities: [], obs: [], timestamps: []})
  }


  vizElement.addEventListener('dataChanged',
    updateChart
  );


  return updateChart;


}

