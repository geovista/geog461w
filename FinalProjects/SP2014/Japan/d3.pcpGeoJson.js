d3.pcpGeoJson = function (collection, options) {

  // ---- Validation of Options ----

  "use strict";

  validateOptions();

  // ---- Variables ---- 

  var m = options.buffers,
      w = options.width - m[1] - m[3],
      h = options.height - m[0] - m[2];

  var x = d3.scale.ordinal().rangePoints([0, w], 1),
      y = {},
      dragging = {};

  var line = d3.svg.line(),
      axis = d3.svg.axis().orient("left"),
      dimensions,
      background,
      foreground;

  // ---- Drawing the PCP ----

  var svg = d3.select(options.id).append("svg:svg")
      .attr("width", w + m[1] + m[3])
      .attr("height", h + m[0] + m[2])
    .append("svg:g")
      .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

  pcpForFeatures();

  svg.lines = foreground;

  return svg;

  // ---- Supporting Functions ----

  function pcpForFeatures () {

    // Extract the list of dimensions and create a scale for each.
    x.domain(dimensions = d3.values(options.keys).filter(function (key) {
      y[key] = d3.scale.linear()
        .domain(d3.extent(collection.features, function (feature) {
          return +feature.properties[key];
        }))
        .range([h, 0]);

      return true;
    }));

    // Add gray background lines for context.
    background = svg.append("svg:g")
        .attr("class", "background")
      .selectAll("path")
        .data(collection.features)
      .enter().append("svg:path")
        .attr("d", path);

    // Add blue foreground lines for focus.
    foreground = svg.append("svg:g")
        .attr("class", "foreground")
      .selectAll("path")
        .data(collection.features)
      .enter().append("svg:path")
        .attr("d", path)
        .on("click", function (feature, index) {
          if (options.linker) { 
            linker(feature, feature.type, "click"); 
          } else {
            foreground.classed("selected", function (d, i) {
              return (d === feature);
            });
          }
        });

    // Add a group element for each dimension.
    var g = svg.selectAll(".dimension")
        .data(dimensions)
      .enter().append("svg:g")
        .attr("class", "dimension")
        .attr("transform", function (d) { return "translate(" + x(d) + ")"; })
        .call(d3.behavior.drag()
          .on("dragstart", function (key) {
            dragging[key] = this.__origin__ = x(key);
            background.attr("visibility", "hidden");
          })
          .on("drag", function (key) {
            dragging[key] = Math.min(w, Math.max(0, this.__origin__ += d3.event.dx));
            foreground.attr("d", path);
            dimensions.sort(function (a, b) { return position(a) - position(b); });
            x.domain(dimensions);
            g.attr("transform", function (d) { return "translate(" + position(d) + ")"; });
          })
          .on("dragend", function (key) {
            delete this.__origin__;
            delete dragging[key];
            transition(d3.select(this)).attr("transform", "translate(" + x(key) + ")");
            transition(foreground)
                .attr("d", path);
            background
                .attr("d", path)
                .transition()
                .delay(500)
                .duration(0)
                .attr("visibility", null);
          }));

    // Add an axis and title.
    g.append("svg:g")
        .attr("class", "axis")
        .each(function (key) { d3.select(this).call(axis.scale(y[key])); })
      .append("svg:text")
        .attr("text-anchor", "middle")
        .attr("y", -9)
        .text(String);

    // Add and store a brush for each axis.
    g.append("svg:g")
        .attr("class", "brush")
        .each(function (key) { d3.select(this).call(y[key].brush = d3.svg.brush().y(y[key]).on("brush", brush)); })
      .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);
  }

  function position (key) {
    var v = dragging[key];
    return ((v === null || v === undefined) ? x(key) : v);
  }

  function transition (g) {
    return g.transition().duration(500);
  }

  // Returns the path for a given data point.
  function path (feature) {
    return line(dimensions.map(function (key) {
      return [position(key), y[key](feature.properties[key])];
    }));
  }

  // Handles a brush event, toggling the display of foreground lines.
  function brush() {
    var actives = dimensions.filter(function(key) { return !y[key].brush.empty(); }),
        extents = actives.map(function(key) { return y[key].brush.extent(); });
    foreground.style("display", function(feature) {
      return actives.every(function(key, i) {
        return extents[i][0] <= feature.properties[key] && feature.properties[key] <= extents[i][1];
      }) ? null : "none";
    });
  }

  // ---- Validation of Options ---- 

  function validateOptions () {

    if (options === undefined || options === null) {
      options = {};
    }

    if (options.buffers === undefined || options.buffers === null) {
      options.buffers = [30, 10, 10, 10];
    }

    if (options.height === undefined || options.height === null) {
      options.height = 500;
    }

    if (options.id === undefined || options.id === null) {
      options.id = "body";
    } else {
      options.id = "#" + options.id;
    }

    if (options.keys === undefined || options.keys === null) {
      options.keys = [];
      var feature = collection.features[0];

      for (var key in feature.properties) {
        if (typeof feature.properties[key] === "number") {
          options.keys.push(key);
        }
      }
    }

    if (options.width === undefined || options.width === null) {
      options.width = 960;
    }

  }
};
