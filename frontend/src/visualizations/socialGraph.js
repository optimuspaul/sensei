import d3Force from "d3-force";
import _ from 'lodash';
import * as d3 from "d3";
import store from './../store/configureStore';
import {entityInflections} from './../constants';

export default function socialGraph(data) {

  if (!data) {
    return
  }

  let state = store.getState();
  let storeEntities = state.entities;
  let canvasWidth = 800;
  let canvasHeight = 500;
  let currentEntityId = _.get(state, 'insights.ui.currentEntityId');
  let currentEntityType = _.get(state, 'insights.ui.currentEntityType');


  document.querySelector("#visualization").innerHTML = `<canvas height=${canvasHeight} width=${canvasWidth}></canvas>`;
  let totalTime = _.sum(data.obs);

  let scalar = d3.scaleLinear()
    .domain([0, d3.max(data.obs)])
    .range([0, 20]);

  let graphData = _.reduce(data.entities, (current, val, index) => { 
    let force = parseInt(scalar(data.obs[index]), 10);
    current.nodes.push({id: `${val[0]}-${val[1]}`, group: 1});
    current.links.push({source: `${val[0]}-${val[1]}`, target: `${val[2]}-${val[3]}`, value: force});
    current.links.push({source: `${val[2]}-${val[3]}`, target: `${val[0]}-${val[1]}`, value: force});
    return current;
   }, {nodes:[], links: []})

  graphData.nodes.push({id: `${currentEntityType}-${currentEntityId}`, group: 1});

  let canvas = document.querySelector("#visualization canvas");
  let context = canvas.getContext("2d");

  let simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(canvasWidth / 2, canvasHeight / 2));

  simulation
    .nodes(graphData.nodes)
    .on("tick", ticked);

  simulation.force("link")
    .links(graphData.links);

  d3.select(canvas)
    .call(d3.drag()
      .container(canvas)
      .subject(dragsubject)
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  function ticked() {
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    context.beginPath();
    graphData.links.forEach(drawLink);
    context.strokeStyle = "#aaa";
    context.stroke();

    context.beginPath();
    graphData.nodes.forEach(drawNode);
    context.fill();
    context.strokeStyle = "#fff";
    context.stroke();
  }

  function dragsubject() {
    return simulation.find(d3.event.x, d3.event.y);
  }

  function dragstarted() {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d3.event.subject.fx = d3.event.subject.x;
    d3.event.subject.fy = d3.event.subject.y;
  }

  function dragged() {
    d3.event.subject.fx = d3.event.x;
    d3.event.subject.fy = d3.event.y;
  }

  function dragended() {
    if (!d3.event.active) simulation.alphaTarget(0);
    d3.event.subject.fx = null;
    d3.event.subject.fy = null;
  }

  function drawLink(d) {
    context.moveTo(d.source.x, d.source.y);
    context.lineTo(d.target.x, d.target.y);
  }

  function drawNode(d) {
    context.moveTo(d.x + 3, d.y);
    context.arc(d.x, d.y, 3, 0, 2 * Math.PI);
  }

  

}