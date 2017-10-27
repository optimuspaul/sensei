import d3Force from "d3-force";
import _ from 'lodash';
import * as d3 from "d3";
import store from './../store/configureStore';
import {entityInflections} from './../constants';

export default function socialGraph(data) {

  if (!data) {
    return
  }

  data = JSON.parse(`{"entities":[["child",10642,"child",35273],["child",35271,"child",35273],["child",35272,"child",35273],["child",35268,"child",35273],["child",35270,"child",35273],["child",35273,"child",10642],["child",35271,"child",35269],["child",10642,"child",35269],["child",35268,"child",35269],["child",35272,"child",35269],["child",35270,"child",35269],["child",35273,"child",35271],["child",10642,"child",35271],["child",35272,"child",35271],["child",35268,"child",35271],["child",35269,"child",35271],["child",35270,"child",35271],["child",10642,"child",35272],["child",35271,"child",35272],["child",10642,"child",35268],["child",35271,"child",35268],["child",35272,"child",35268],["child",35269,"child",35268],["child",35273,"child",35268],["child",35270,"child",35268],["child",35271,"child",35270],["child",10642,"child",35270],["child",35272,"child",35270],["child",35273,"child",35270],["child",35268,"child",35270],["child",35269,"child",35270],["child",35268,"child",10642],["child",35272,"child",10642],["child",35271,"child",10642],["child",35270,"child",10642],["child",35269,"child",10642],["child",35268,"child",35272],["child",35269,"child",35272],["child",35273,"child",35272],["child",35270,"child",35272]],"obs":[1810,940,5560,880,330,1810,1730,1560,1710,3310,960,940,2080,1110,730,1730,860,2940,1110,1020,730,3060,1710,880,1520,860,1000,1670,330,1520,960,1020,2940,2080,1000,1560,3060,3310,5560,1670],"timestamps":["2017-07-01T05:00:00Z","2017-10-25T05:00:00Z"]}`)

  let state = store.getState();
  let storeEntities = state.entities;
  let zoom = parseInt(_.get(store.getState(), "insights.ui.zoom")) || 1;
  let canvasWidth = 1000;
  let canvasHeight = 800;
  let currentEntityId = _.get(state, 'insights.ui.currentEntityId');
  let currentEntityType = _.get(state, 'insights.ui.currentEntityType');

  document.querySelector("#visualization").innerHTML = `<svg id="social-graph" height=${canvasHeight} width=${canvasWidth}><g id="container"></g></svg>`;

  let scalar = d3.scaleLinear()
    .domain([d3.min(data.obs), d3.max(data.obs)+d3.deviation(data.obs)])
    .range([0, 20]).clamp(true);

  let scaleTwenty = d3.scaleLinear().domain([0, 20])
  let scaleZoom = d3.scaleLinear().domain([1,5])

  let zoomLevel = scaleZoom.range([2,5])(zoom);


  let graphData = _.reduce(data.entities, (current, val, index) => {
    let force = parseInt(scalar(data.obs[index]), 10);
    let entity = storeEntities.children[val[1]];
    let entityName = entity ? entity.displayName : `${val[0]}-${val[1]}`;
    let node = {id: `${val[0]}-${val[1]}`, group: 1, label: entityName};
    if (!_.find(current.nodes, node)) {
      current.nodes.push(node);
    }
    if (!_.find(current.links, {source: `${val[2]}-${val[3]}` , target: `${val[0]}-${val[1]}`, value: force})) {
      current.links.push({source: `${val[0]}-${val[1]}`, target: `${val[2]}-${val[3]}`, value: force});
    }
    return current;
   }, {nodes:[], links: [], bilinks: []})


  var svg = d3.select("#visualization svg g#container")
  svg.attr("transform", `scale(${zoomLevel})`);

  var color = d3.scaleOrdinal(d3.schemeCategory20);

  var mb = d3.forceManyBody();

  mb.strength((d) => { 
    return d3.scaleLinear().domain([0, 20]).range([-300,0])(d.value)
  });

  var simulation = d3.forceSimulation()
      .force("link", d3.forceLink().distance(calcDistance).strength(calcStrength))
      .force("charge", mb)
      .force("center", d3.forceCenter(canvasWidth / (2*zoomLevel), canvasHeight / (2*zoomLevel)));

  var nodeById = d3.map(graphData.nodes, function(d) { return d.id; });

  graphData.links.forEach(function(link) {
    var s = link.source = nodeById.get(link.source),
        t = link.target = nodeById.get(link.target),
        i = {value: link.value}; // intermediate node
        s.value = link.value;
        t.value = link.value;
    graphData.nodes.push(i);
    graphData.links.push({source: s, target: i, value: link.value}, {source: i, target: t, value: link.value});
    graphData.bilinks.push([s, i, t]);
  });

  var link = svg.selectAll(".link")
    .data(graphData.bilinks)
    .enter().append("path")
      .attr("style", function(d) { 
        
        return `stroke-width: ${scaleTwenty.range([scaleZoom.range([1,0.3])(zoom), scaleZoom.range([5,3])(zoom)])(d[0].value)};
                stroke: rgba(24,140,99,${scaleTwenty.range([-0.1,1.5])(d[0].value)})`; 
      })
      .attr("class", "link");



  var node = svg.selectAll(".node")
    .data(graphData.nodes.filter(function(d) { return d.id; }))
    .enter().append("circle")
      .attr("class", "node")
      .attr("r", scaleZoom.range([2,1])(zoom))
      .attr("fill", function(d) { return color(d.group); })
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));


  var label = svg.append("g")
      .attr("class", "labels")
      .selectAll("text")
      .append("text")
      .data(graphData.nodes)
      .enter().append("text")
      .text(node => node.label)
      .attr('style', `font-size: ${scaleZoom.range([5,2])(zoom)}px`)
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

  simulation
      .nodes(graphData.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(graphData.links);

  function positionLink(d) {
  return "M" + d[0].x + "," + d[0].y
       + "S" + d[1].x + "," + d[1].y
       + " " + d[2].x + "," + d[2].y;
  }

  function positionNode(d) {
    return "translate(" + d.x + "," + d.y + ")";
  }

  function ticked() {
    link.attr("d", positionLink);

    

    node.attr("transform", (d) => {
      return "translate(" + d.x + "," + d.y + ")";
    });

    label.attr("transform", (d) => {
      return "translate(" + d.x+30 + "," + d.y+20 + ")";
    });
  }

  function calcStrength(d) {
    return d3.scaleLinear().domain([0, 20]).range([0.5,1])(d.value);
  }

  function calcDistance(d) {
    return d3.scaleLinear().domain([0, 20]).range([50, 0])(d.value);
  }

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }



}
