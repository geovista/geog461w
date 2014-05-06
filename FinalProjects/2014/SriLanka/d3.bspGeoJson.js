d3.bspGeoJson = function (collection, options) { 

  // ---- Validation of Options ----

  "use strict";

  validateOptions();

  // ---- Variables ----

  var width = options.width - options.margin[3] - options.margin[1],
      height = options.height - options.margin[0] - options.margin[2];

  var x = d3.scale.linear()
      .range([0, width]);

  var y = d3.scale.linear()
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .ticks(options.ticksx)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .ticks(options.ticksy)
      .orient("left");

  var svg = d3.select(options.id).append("svg")
      .attr("width", width + options.margin[3] + options.margin[1])
      .attr("height", height + options.margin[0] + options.margin[2])
    .append("g")
      .attr("transform", "translate(" + options.margin[3] + "," 
                                      + options.margin[0] + ")");

  var dots,
      xAxisSvg,
      yAxisSvg;

  bspForFeatures();
  svg.dots = dots;
  svg.updateVariables = updateVariables;
  svg.updateVariablesWithNames = updateVariablesWithNames;
  return svg;

  // ---- Drawing the Bivariate Scatter Plot ----

  function bspForFeatures () {

    if (options.domainx instanceof Array) {
      x.domain(options.domainx);  
    } else if (options.domainx === "max") {
      x.domain([0, d3.max(collection.features, function (feature) { 
        return feature.properties[options.var1]; 
      })]).nice();
    } else {
      console.warn("bspGeoJson: Using d3.extent to define x-axis range.")
      x.domain(d3.extent(collection.features, function (feature) { 
        return feature.properties[options.var1]; 
      })).nice();
    }
    
    if (options.domainy instanceof Array) {
      y.domain(options.domainy);
    } else if (options.domainy === "max") {
      y.domain([0, d3.max(collection.features, function (feature) { 
        return feature.properties[options.var2]; 
      })]).nice();
    } else {
      console.warn("bspGeoJson: Using d3.extent to define y-axis range")
      y.domain(d3.extent(collection.features, function (feature) { 
        return feature.properties[options.var2]; 
      })).nice(); 
    }

    xAxisSvg = svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
      .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text((options.name1 ? options.name1 : options.var1));

    yAxisSvg = svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text((options.name2 ? options.name2 : options.var2));

    dots = svg.selectAll(".dot")
        .data(collection.features)
      .enter().append("circle")
        .attr("class", "dot")
        .attr("r", options.radius)
        .attr("cx", function (feature) { return x(feature.properties[options.var1]); })
        .attr("cy", function (feature) { return y(feature.properties[options.var2]); })
        .style("fill", function (feature) { 
          var cls1 = options.classifier(options.var1, feature.properties[options.var1]);
          var cls2 = options.classifier(options.var2, feature.properties[options.var2]);
          return options.colorizer(cls1, cls2);
        })
        .style("display", function (feature) {
          return (feature.properties[options.var1] && feature.properties[options.var2] ? 'inline' : 'none');
        })
        .on("click", function (feature, index) {
          if (options.linker) { 
            linker(feature, feature.type, "click"); 
          } else {
            dots.classed("selected", function (d, i) {
              return (d === feature);
            });
          }
        });
  }

  // ---- Utility Functions ----

  function validateOptions () {

    if (!options.var1) {
      console.error("bspGeoJson: No variable provided as option 'var1'." + 
        "Must provide 'var1' as a String or a Number.");
    }

    if (!options.var2) {
      console.error("bspGeoJson: No variable provided as option 'var2'." + 
        "Must provide 'var2' as a String or a Number.");
    }

    if (!options.classifier) {
      console.error("bspGeoJson: No classifier provided." + 
        "Must provide 'classifier' as a Function.");
    }

    if (!options.colorizer) {
      console.error("bspGeoJson: No colorizer provided." + 
        "Must provide 'colorizer' option as a Function.");
    }

    if (!options.margin || options.margin.length < 4) {
      console.warn("bspGeoJson: Using default margins.")
      options.margin = [20, 20, 30, 40];
    }

    if (!options.id) {
      console.warn("bspGeoJson: Using default id, 'body', for selector.")
      options.id = "body";
    } 

    if (options.id[0] !== '#') {
      options.id = "#" + options.id;
    }

    if (!options.radius) {
      console.warn("bspGeoJson: Using default radius, 3.5px.")
      options.radius = 3.5;
    }

    if (!options.width) {
      console.warn("bspGeoJson: Using default width, 400px.")
      options.width = 400; 
    }

    if (!options.height) {
      console.warn("bspGeoJson: Using default height, 400px.")
      options.height = 3.5; 
    }

    if (!options.ticksx) {
      console.warn("bspGeoJson: Using default number of ticks, 5.")
      options.ticksx = 5; 
    }

    if (!options.ticksy) {
      console.warn("bspGeoJson: Using default number of ticks, 5.")
      options.ticksy = 5; 
    }

  }

  function updateVariables (var1, var2) {
    d3.selectAll(options.id + ' .axis').remove();
    d3.selectAll(options.id + ' .label').remove();
    d3.selectAll(options.id + ' .dot').remove();

    options.var1 = var1;
    options.var2 = var2;

    validateOptions();
    bspForFeatures();
  }

  function updateVariablesWithNames (var1, name1, var2, name2) {
    options.name1 = name1;
    options,name2 = name2;

    updateVariables(var1, var2);
  }

};
