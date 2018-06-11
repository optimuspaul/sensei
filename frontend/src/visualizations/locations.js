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
                      .range([0, 15]); 
  let state = store.getState();
  let storeEntities = state.entities;
  let vizElement = document.querySelector("#visualization #locations");
  chartWidth = _.get(vizElement, 'parentElement.offsetWidth', 800) - 20;

  let chart = d3.select("#visualization #locations svg")
  chart.append('g').attr("class", 'sensors');
  chart.append('g').attr("class", 'paths');

  let color = d3.scaleOrdinal(d3.schemeCategory10).domain([0,5]);

    let updateChart = (event) => {

      let sensors = [];
      let pathsData = [];
      let obs = [];

      let data = event.detail
      let currentIndex;
      if (!_.isEmpty(data) && !_.isEmpty(data.obs)) {
        let obsCount = _.size(data.obs);
        let zoom = event.zoom || parseInt(_.get(store.getState(), "insights.ui.zoom")) || (obsCount-1);
        currentIndex = zoom === -1 ? obsCount + 1 : obsCount - zoom;
        sensors = _.get(data, `obs.${currentIndex}.sensors`);
        obs = data.obs
      } else {
        data = {
          classroomLength: 0,
          classroomWidth: 0
        }
      }
      let areasWithCoords = _.filter(_.get(store.getState(), `entities.areas`, {}), (area) => {
        return _.isNumber(area.xPosition) && _.isNumber(area.yPosition);
      });
      let areas = _.map(areasWithCoords, (area) => {
        return {entityId: area.id, entityType: 'area', x: area.xPosition, y: area.yPosition, xStdDev: 0, yStdDev: 0}
      });

      sensors = _.concat(areas, sensors);

      classroomLength = data.classroomLength;
      classroomWidth = data.classroomWidth;
      classroomScale = d3.scaleLinear()
                      .domain([0, classroomLength])
                      .range([0, chartWidth]);
      let classroomXScale = d3.scaleLinear()
                      .domain([0, classroomLength])
                      .range([0, chartWidth]);
      chartHeight = classroomScale(classroomWidth);
      let classroomYScale = d3.scaleLinear()
                      .domain([0, classroomWidth])
                      .range([0, chartHeight]);
      chart.attr("width", chartWidth).attr("height", chartHeight)

      let sensorWrapper = chart.select('g.sensors');
      let pathsWrapper = chart.select('g.paths');
      let showPathFor;
      let t = d3.transition()
        .duration(1000)
        .ease(d3.easeCubic);



      



      let circle = sensorWrapper
        .selectAll(`circle.fill`)
        .data(sensors)

      circle.exit().remove();

      circle.enter().append("circle")
        .merge(circle)
        .transition(t)
        .attr('class', (sensor) => {
          return  `${sensor.entityType} fill`
        })
        .attr("cx", sensor => classroomScale(sensor.x))
        .attr("cy", sensor => classroomScale(sensor.y))
        .attr("r", 10)
        .attr("style", (sensor) => {
          return `stroke-width: ${pulseScale((sensor.xStdDev+sensor.yStdDev)/2)}`
        })
        
      circle.on('click', (sensor) => {
        let entityUid = `${sensor.entityType}-${sensor.entityId}`;
          let path = vizElement.querySelector(`.${entityUid}-path`)
          let prevPath = vizElement.querySelector(`path.show`);
          if (prevPath) {
            prevPath.classList.remove('show');
            if (prevPath.hasClass(`${entityUid}-path`)) {
              showPathFor = null;
              return;
            }
          }
          if (path) {
            showPathFor = entityUid;
            path.classList.add('show');
          }
        })

      let text = sensorWrapper
        .selectAll(`text`)
        .data(sensors)

      text.exit().remove();

      text.enter().append("text")
        .merge(text)
        .transition(t)
        .attr('class', (sensor) => {
          return  `${sensor.entityType} fill`
        })
        .attr("x", sensor => classroomScale(sensor.x)+5)
        .attr("y", (sensor) => { 
          let scaledY = classroomScale(sensor.y);
          let delta = _.sample([20,-20]);
          if (scaledY < 50) { delta = 20 }
          if (scaledY > (classroomScale(classroomWidth)-50)) { delta = -20}
          return scaledY + delta;
        })
        .text(sensor => _.get(state, `entities.${entityInflections[sensor.entityType]}.${sensor.entityId}.displayName`))


        if (!_.isEmpty(obs)) {
        
        let line = d3.line()
                   .curve(d3.curveLinear)
                   .x(function(d) { return classroomXScale(d[0]) })
                   .y(function(d) { return classroomYScale(d[1]) });
        pathsData = _.map(obs[0].sensors, (sensor, index) => {
            let points = _.map(_.slice(obs, currentIndex), (ob) => {
              return [ob.sensors[index].x, ob.sensors[index].y];
            });
            return _.merge({path: line(points)}, sensor);
          });

        let path = pathsWrapper
          .selectAll('path')
          .data(pathsData)

        path.exit().remove();

        path.enter().append("path")
          .merge(path)
          .transition(t)
          .attr('d', sensor => sensor.path)
          .attr('class', (sensor, i) => {
            let entityUid = `${sensor.entityType}-${sensor.entityId}`;
            return `${entityUid}-path ${sensor.entityType} stroke ${showPathFor === entityUid ? 'show' : ''}`
          });
          
        path.on('click', (sensor) => {
          let entityUid = `${sensor.entityType}-${sensor.entityId}`;
          let path = vizElement.querySelector(`.${entityUid}-path`);
          path.classList.remove('show');
          showPathFor = null;
        })
        
      }


    }

    vizElement.addEventListener('dataChanged',
      updateChart
    );

    return updateChart;

  

}
