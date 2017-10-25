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
  let canvasWidth = 1000;
  let canvasHeight = 800;
  let currentEntityId = _.get(state, 'insights.ui.currentEntityId');
  let currentEntityType = _.get(state, 'insights.ui.currentEntityType');

  document.querySelector("#visualization").innerHTML = `<svg id="social-graph" height=${canvasHeight} width=${canvasWidth}></svg>`;

  let scalar = d3.scaleLinear()
    .domain([0, d3.max(data.obs)])
    .range([0, 20]);

  let graphData = _.reduce(data.entities, (current, val, index) => {
    let force = parseInt(scalar(data.obs[index]), 10);
    let entity = storeEntities.children[val[1]];
    let entityName = entity ? entity.displayName : "Unknown";
    current.nodes.push({id: `${val[0]}-${val[1]}`, group: 1, label: entityName});
    if (_.find(current.links, {source: `${val[2]}-${val[3]}` , target: `${val[0]}-${val[1]}`, value: force})) return current;
    current.links.push({source: `${val[0]}-${val[1]}`, target: `${val[2]}-${val[3]}`, value: force});
    return current;
   }, {nodes:[], links: [], bilinks: []})


  var svg = d3.select("#visualization svg");

  var color = d3.scaleOrdinal(d3.schemeCategory20);

  var mb = d3.forceManyBody();

  mb.strength(() => { return -50 });

  var simulation = d3.forceSimulation()
      .force("link", d3.forceLink().distance(50).strength(0.2))
      .force("charge", mb)
      .force("center", d3.forceCenter(canvasWidth / 2, canvasHeight / 2));

  var nodeById = d3.map(graphData.nodes, function(d) { return d.id; });

  graphData.links.forEach(function(link) {
    var s = link.source = nodeById.get(link.source),
        t = link.target = nodeById.get(link.target),
        i = {}; // intermediate node
    graphData.nodes.push(i);
    graphData.links.push({source: s, target: i}, {source: i, target: t});
    graphData.bilinks.push([s, i, t]);
  });

  var link = svg.selectAll(".link")
    .data(graphData.bilinks)
    .enter().append("path")
      .attr("class", "link");



  var node = svg.selectAll(".node")
    .data(graphData.nodes.filter(function(d) { return d.id; }))
    .enter().append("circle")
      .attr("class", "node")
      .attr("r", 5)
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
      .attr('font-size', 15)
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
      return "translate(" + d.x+5 + "," + d.y+3 + ")";
    });
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
