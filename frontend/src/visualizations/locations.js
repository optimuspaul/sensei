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

  let chartMaxSize = 1400;

  let radiusScale = d3.scaleLinear()
                      .domain([0, 1])
                      .range([5, 20]);
  let pulseScale = d3.scaleLinear()
                      .domain([0, 1])
                      .range([10, 0]); 
  let state = store.getState();
  let storeEntities = state.entities;

  let chart = d3.select("#visualization.locations svg")
  chart.append('g')
    .attr("class", 'sensors')

  firebase.firestore()
    .collection(`classrooms`)
    .doc(getClassroomId())
    .get()
    .then((doc) => {
      if (doc.exists) {
        return doc.data();
      }
    })
    .then((classroom) => {
      rotate = classroom.width >= classroom.height
      let upperDomain = rotate ? classroom.width : classroom.height;
      let lowerDomain = rotate ? classroom.height : classroom.width;
      
      classroomScale = d3.scaleLinear()
                      .domain([0, upperDomain])
                      .range([0, chartMaxSize]);
      chartHeight = classroomScale(lowerDomain);
      chartWidth = classroomScale(upperDomain);
      chart.attr("width", chartWidth).attr("height", chartHeight)
      return firebase.firestore()
        .collection(`classrooms`)
        .doc(getClassroomId())
        .collection('locationReports')
        .onSnapshot(function(snapshot) {
          _.each(snapshot.docChanges, (change, index) => {
            if (change.type === "added") {
              // setTimeout(() => { 
                updateLocations(change.doc.data().sensors) 
              // }, index*5000);
            }
          });
        });
    })


    function updateLocations(sensors) {
      let sensorWrapper = chart.select('g.sensors');

      let t = d3.transition()
        .duration(1000)
        .ease(d3.easeCubic);

      _.each(['pulse', 'fill'], (c) => {

        sensorWrapper.selectAll(`circle.${c}`)
          .data(sensors)
          .enter()
          .append("circle")
          .attr('class', c)

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

  

}
