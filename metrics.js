

var width = 960,
    height = 700,
    radius = (Math.min(width, height) / 2) - 10;

var formatNumber = d3.format(",d");

var x = d3.scaleLinear()
    .range([0, 2 * Math.PI]);

var y = d3.scaleSqrt()
    .range([0, radius]);

var color = d3.scaleOrdinal(d3.schemeCategory20);

var partition = d3.partition();

var arc = d3.arc()
    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
    .innerRadius(function(d) { return Math.max(0, y(d.y0)); })
    .outerRadius(function(d) { return Math.max(0, y(d.y1)); });

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
        .attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");

function click(d) {
    svg.transition()
        .duration(750)
        .tween("scale", function() {
            var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
                yd = d3.interpolate(y.domain(), [d.y0, 1]),
                yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
            return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
        })
        .selectAll("path")
            .attrTween("d", function(d) { return function() { return arc(d); }; });
}

d3.select(self.frameElement).style("height", height + "px");


function draw(root) {
    root = d3.hierarchy(root);
    root.sum(function(d) { return d.size; });
    svg.selectAll("path")
        .data(partition(root).descendants())
        .enter()
            .append("path")
                .attr("d", arc)
                .style("fill", function(d) { return color((d.children ? d : d.parent).data.name); })
                .on("click", click)
            .append("title")
                .text(function(d) { return d.data.name + "\n" + formatNumber(d.value); });
}






function buildBranch(base, data) {
    for (var i in data) {
        if (-1 != ["_value", "newtab", ""].indexOf(i)) {
            continue;
        }

        var branch = buildBranch({
                            "name": i,
                            "children": [],
                            "size": data[i]._value
                        }, data[i]);

        if (-1 == branch.size || !branch.size) {
            delete(branch.size);
        }

        if (0 == branch.children.length) {
            delete(branch.children);
        }

        base.children.push(branch);
    }
    return base;
}

function buildTree(data) {
    var tree = {};
    for (var i in data) {
        if (!tree[i]) tree[i] = {};
        for (j in data[i]) {
            var v = parseInt(data[i][j]);
            var d = tree[i];
            var p = j.split('/');
            if (2 == p.length && "" == p[1]) {
                p[1] = "index";
            }
            for (var k=1; k<p.length; k++) {
                if (!d[p[k]]) d[p[k]] = {
                    "_value": -1
                };
                if (k == p.length-1) {
                    d[p[k]]._value = v;
                } else {
                    d = d[p[k]];
                }
            }
        }
    }
    return buildBranch({
        "name": "websites",
        "children": []
    }, tree);
}



// Sunburst Chart
// https://bl.ocks.org/maybelinot/5552606564ef37b5de7e47ed2b7dc099
var sourceData;
function loadData(data) {
    sourceData = data;
    var root = buildTree(data);
    draw(root);
}

window.addEventListener("resize", draw);


function viewMetrics(data) {
    loadData(data);
}




/*
var svg = d3.select("svg"),
    margin = { top: 20, right: 20, bottom: 60, left: 40 },
    x = d3.scaleBand().padding(0.1),
    y = d3.scaleLinear(),
    theData = undefined;

var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

g.append("g")
    .attr("class", "axis axis--x");

g.append("g")
    .attr("class", "axis axis--y");

g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", "0.71em")
    .attr("text-anchor", "end")
    .text("Seconds");


// Prep the tooltip bits, initial display is hidden
var tooltip = svg.append("g")
    .attr("class", "tooltip")
    .style("display", "none");

tooltip.append("rect")
    .attr("width", 60)
    .attr("height", 20)
    .attr("fill", "white")
    .style("opacity", 0.5);

tooltip.append("text")
    .attr("x", 30)
    .attr("dy", "1.2em")
    .style("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("font-weight", "bold");



function draw() {

    var bounds = svg.node().getBoundingClientRect(),
        width = bounds.width - margin.left - margin.right,
        height = bounds.height - margin.top - margin.bottom;

    x.rangeRound([0, width]);
    y.rangeRound([height, 0]);

    g.select(".axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
            .attr("y", 0)
            .attr("x", 9)
            .attr("dy", ".35em")
            .attr("transform", "rotate(45)")
            .style("text-anchor", "start");

    g.select(".axis--y")
        .call(d3.axisLeft(y).ticks(10));

    var bars = g.selectAll(".bar")
        .data(theData);

    // ENTER
    bars
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (d) { return x(d.hostname); })
        .attr("y", function (d) { return y(d.seconds); })
        .attr("width", x.bandwidth())
        .attr("height", function (d) { return height - y(d.seconds); })
        .attr("title", function (d) { return d.url; })
        .on("mouseover", function() { tooltip.style("display", null); })
        .on("mouseout", function() { tooltip.style("display", "none"); })
        .on("mousemove", function(d) {
            // console.log(d);
            var xPosition = d3.mouse(this)[0] - 5;
            var yPosition = d3.mouse(this)[1] - 5;
            tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
            tooltip.select("text").text(d[1]-d[0]);
        });

    // UPDATE
    bars.attr("x", function (d) { return x(d.hostname); })
        .attr("y", function (d) { return y(d.seconds); })
        .attr("width", x.bandwidth())
        .attr("height", function (d) { return height - y(d.seconds); });

    // EXIT
    bars.exit()
        .remove();

}


// TODO: Stacked barchart
// http://bl.ocks.org/mstanaland/6100713
var sourceData;
function loadData(data) {
    sourceData = data;
    theData = [];
    for (var i in data) {
        for (j in data[i]) {
            theData.push({
                hostname: i,
                pathname: j,
                seconds: data[i][j]
            });
        }
    }

    x.domain(theData.map(function (d) { return d.hostname; }));
    y.domain([0, d3.max(theData, function (d) { return d.seconds; })]);

    draw();
}

window.addEventListener("resize", draw);


function viewMetrics(data) {
    loadData(data);
}
*/
