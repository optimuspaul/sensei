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
                      .domain([0, 5])
                      .range([10, 0]); 
  let state = store.getState();
  let storeEntities = state.entities;
  let vizElement = document.querySelector("#visualization #locations");
  let chartMaxSize = _.get(vizElement, 'parentElement.offsetWidth', 800) - 20;

  let chart = d3.select("#visualization #locations svg")
  chart.append('g')
    .attr("class", 'sensors')

  
    let classroomHeight, classroomWidth;


    let updateChart = (event) => {

      let zoom = event.zoom || parseInt(_.get(store.getState(), "insights.ui.zoom")) || -1;

      let data = event.detail
      if (!data || !data.obs || !_.get(data, `obs.0.sensors`)) return;

      let obsCount = _.size(data.obs);
      let currentIndex = zoom === -1 ? obsCount + 1 : obsCount - zoom;
      let sensors = _.get(data, `obs.${currentIndex}.sensors`);

      if (!sensors) return;

      if (classroomHeight !== data.classroomHeight || classroomWidth !== data.classroomWidth) {
        classroomHeight = data.classroomHeight;
        classroomWidth = data.classroomWidth;
        rotate = classroomWidth >= classroomHeight;
        let upperDomain = rotate ? classroomWidth : classroomHeight;
        let lowerDomain = rotate ? classroomHeight : classroomWidth;
        
        classroomScale = d3.scaleLinear()
                        .domain([0, upperDomain])
                        .range([0, chartMaxSize]);
        chartHeight = classroomScale(lowerDomain);
        chartWidth = classroomScale(upperDomain);
        chart.attr("width", chartWidth).attr("height", chartHeight)
      }


      let sensorWrapper = chart.select('g.sensors');

      let t = d3.transition()
        .duration(1000)
        .ease(d3.easeCubic);

      _.each(['pulse', 'fill'], (c) => {

        sensorWrapper.selectAll(`circle.${c}`)
          .data(sensors)
          .enter()
          .append("circle")
          .attr('class', (sensor) => {
            return  `${sensor.entityType} ${c}`
          })

        sensorWrapper.selectAll(`circle.${c}`)
          .transition(t)
          .attr("cx", (sensor, index) => {
            return classroomScale(sensor[rotate ? 'y': 'x']);
          })
          .attr("cy", (sensor) => {
            return classroomScale(sensor[rotate ? 'x': 'y']);
          })
          .attr("r", (sensor) => {
            return 10 + (c === 'pulse' ? pulseScale(sensor.strength) : 0);
          })
          
      })
    }

    vizElement.addEventListener('dataChanged',
      updateChart
    );

    return updateChart;

  

}
