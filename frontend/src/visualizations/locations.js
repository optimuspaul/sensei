import './locations.css';
import * as d3 from "d3";
import {entityInflections, getClassroomId} from './../constants';
import store from './../store/configureStore';
import firebase from './../firebase';
import _ from 'lodash';


export default function locations() {

  let chartWidth,
      rotate,
      classroomScale,
      chartHeight;

  let radiusScale = d3.scaleLinear()
                      .domain([0, 5])
                      .range([5, 20]);
  let pulseScale = d3.scaleLinear()
                      .domain([0, 1])
                      .range([0, 15]); 
  let state = store.getState();
  let storeEntities = state.entities;
  let vizElement = document.querySelector("#visualization #locations");
  let chartMaxWidth = _.get(vizElement, 'parentElement.offsetWidth', 800) - 20;

  let chart = d3.select("#visualization #locations svg")
  chart.append('g')
    .attr("class", 'sensors')

  

    let classroomLength = 0, 
    classroomWidth = 0;


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
        classroomScale = d3.scaleLinear()
                        .domain([0, upperDomain])
                        .range([0, chartMaxWidth]);
        chartHeight = classroomScale(data.classroomWidth);
        chartWidth = classroomScale(data.classroomLength);
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
            return classroomScale(sensor[rotate ? 'y': 'x']);
          })
          .attr("cy", (sensor) => {
            return classroomScale(sensor[rotate ? 'x': 'y']);
          })
          .attr("r", (sensor) => {
            let r = 10 + (c === 'pulse' ? pulseScale(10*(sensor.xStdDev+sensor.yStdDev)/2) : 0);
            // r = sensor.entityType === 'child' || sensor.entityType === 'teacher' ? r : r/2;
            return r;
          })
          .attr("style", (sensor) => {
            return `stroke-width: ${pulseScale((sensor.xStdDev+sensor.yStdDev)/2)}`
          })
          
      })
    }

    vizElement.addEventListener('dataChanged',
      updateChart
    );

    return updateChart;

  

}
