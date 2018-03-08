import './locations.css';
import * as d3 from "d3";
import {entityInflections, getClassroomId} from './../constants';
import store from './../store/configureStore';
import firebase from './../firebase';
import _ from 'lodash';


export default function locations() {

  let chartWidth,
      classroomScale,
      chartHeight,
      classroomLength = 0, 
      classroomWidth = 0;

  let radiusScale = d3.scaleLinear()
                      .domain([0, 5])
                      .range([5, 20]);
  let pulseScale = d3.scaleLinear()
                      .domain([0, 1])
                      .range([0, 10]); 
  let state = store.getState();
  let storeEntities = state.entities;
  let vizElement = document.querySelector("#visualization #locations");
  chartWidth = _.get(vizElement, 'parentElement.offsetWidth', 800) - 20;

  let chart = d3.select("#visualization #locations svg")
  chart.append('g')
    .attr("class", 'sensors');


    let updateChart = (event) => {

      let sensors = []

      let data = event.detail

      if (!_.isEmpty(data) && !_.isEmpty(data.obs)) {
        let obsCount = _.size(data.obs);
        let zoom = event.zoom || parseInt(_.get(store.getState(), "insights.ui.zoom")) || (obsCount-1);
        let currentIndex = zoom === -1 ? obsCount + 1 : obsCount - zoom;
        sensors = _.get(data, `obs.${currentIndex}.sensors`);
      } else {
        data = {
          classroomLength: 0,
          classroomWidth: 0
        }
      }

     

      if (classroomLength !== data.classroomLength || classroomWidth !== data.classroomWidth) {
        classroomLength = data.classroomLength;
        classroomWidth = data.classroomWidth;
        classroomScale = d3.scaleLinear()
                        .domain([0, classroomLength])
                        .range([0, chartWidth]);
        chartHeight = classroomScale(classroomWidth);
        chart.attr("width", chartWidth).attr("height", chartHeight)
      }

      let sensorWrapper = chart.select('g.sensors');

      let t = d3.transition()
        .duration(1000)
        .ease(d3.easeCubic);

      _.each(['fill'], (c) => {

        let circle = sensorWrapper
          .selectAll(`circle.${c}`)
          .data(sensors)

        circle.exit().remove();

        circle.enter().append("circle")
          .merge(circle)
          .transition(t)
          .attr('class', (sensor) => {
            return  `${sensor.entityType} ${c}`
          })
          .attr("cx", (sensor, index) => {
            let x = sensor.x;
            if (sensor.entityType === 'area') {
              x = _.get(store.getState(), `entities.areas.${sensor.entityId}.xPosition`, sensor.x)
            }
            return classroomScale(x);
          })
          .attr("cy", (sensor) => {
            let y = sensor.y;
            if (sensor.entityType === 'area') {
              y = _.get(store.getState(), `entities.areas.${sensor.entityId}.yPosition`, sensor.y)
            }
            return classroomScale(sensor.y);
          })
          .attr("r", (sensor) => {
            let r = 10 + (c === 'pulse' ? pulseScale(10*(sensor.xStdDev+sensor.yStdDev)/2) : 0);
            r = sensor.entityType === 'child' || sensor.entityType === 'teacher' ? r : r/2;
            return r;
          })
          .attr("style", (sensor) => {
            return `stroke-width: ${pulseScale(10*(sensor.xStdDev+sensor.yStdDev)/2)}`
          })
          
      })
    }

    vizElement.addEventListener('dataChanged',
      updateChart
    );

    return updateChart;

  

}
