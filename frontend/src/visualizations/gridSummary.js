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
const keyboxWidth = boxWidth/2


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
    let chartHeight = _.size(segmentedData)*boxWidth + 100;
    let legendHeight = _.size(segmentedData)*boxWidth
    let keyboxWidth = _.size(segmentedData) > 1 ? legendHeight / 5 : (legendHeight*2) / 5;
    let maxTotal = d3.max(allObs);
    let color = d3.scaleLinear(d3.schemeCategory20).range(["white", "#999999"]).domain([0,maxTotal]);
    var xScalar = d3.scaleLinear().domain([0, maxTotal]).range([0, chartWidth-offset-100]);
    var keyScalar = d3.scaleLinear().domain([0, 5]).range([0, maxTotal]);
    


    



    chart.attr("width", chartWidth + 200)
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
        return `fill:${color(d.obs)};stroke: #000`;
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

    let keys = _.reverse(_.times(5, keyScalar));
    let key = chart.selectAll("g.key")
      .data(keys)

    key.exit().remove();

    key.enter().append("g")
       .merge(key)
       .attr('class', 'key')
       .attr("transform", (d, i) => {
          return `translate(${chartWidth-offset+100},${i*keyboxWidth + 17})`;
        })

    let keyRect = key.selectAll('rect').data(d => [d]);

    keyRect.exit().remove();    

    keyRect.enter().append('rect')
       .attr("x", 0)
       .attr("y", 0)
       .attr('width', keyboxWidth)
       .attr('height', keyboxWidth)
       .attr("style", function(d, i) {
        return `fill:${color(d)};stroke: #000`;
      })

    let keyText = key.selectAll('text').data(d => [d]);   

    keyText.exit().remove();

    keyText.enter().append('text')
       .attr("x", keyboxWidth+20)
       .attr("y", keyboxWidth/2+5)
       .attr('width', keyboxWidth)
       .attr('height', keyboxWidth)
       .text((d) => {
          if (maxTotal < 3600) {  
            return `${(d/60).toFixed(0)}m`;
          } else {
            return `${(d/60/60).toFixed(0)}hr`;
          }
        });

  }

  vizElement.addEventListener('dataChanged',
    updateChart
  );
  updateChart({detail: data})

  return updateChart;

}