/**
 * @file
 *   Javascript that initializes visualizations on the page.
 */

(function ($) {

  /**
   * Helper functions.
   */
  // @link: http://stackoverflow.com/questions/979975/how-to-get-the-value-from-the-url-parameter.
  var QueryString = function () {
    // This function is anonymous, is executed immediately and
    // the return value is assigned to QueryString!
    var query_string = {};
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      if (typeof query_string[pair[0]] === "undefined") {
        query_string[pair[0]] = decodeURIComponent(pair[1]);
      }
      else if (typeof query_string[pair[0]] === "string") {
        var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
        query_string[pair[0]] = arr;
      }
      else {
        query_string[pair[0]].push(decodeURIComponent(pair[1]));
      }
    }
    return query_string;
  }();

  /**
   * @link http://stackoverflow.com/a/6078873
   */
  function timeConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
    return time;
  }

  var getInfoCardColour = function(limit1, limit2, val) {
    var colours_asc = ['bg-red', 'bg-orange', 'bg-yellow', 'bg-aqua', 'bg-green'];
    if (limit1 > limit2) {
      var min = limit2, max = limit1, colors = colours_asc.reverse();
    }
    else {
      var min = limit1, max = limit2, colors = colours_asc;
    }

    if(max <= 0 || val >= max) {
      return colors.pop();
    }
    else {
      var category = Math.floor((colors.length * (val - min))/(max - min));
      return colors.slice(category)[0];
    }
  }

  var createWorldStatsColorMap = function(worldStats, color, keyName){
    var newColorMap = {};
    for (var key in worldStats) {
      if (!worldStats.hasOwnProperty(key)) continue;
      newColorMap[key] = worldStats[key].totalCount ? color(worldStats[key][keyName]) : color(1);
    }
    return newColorMap;
  }
  /**
   * Visualization Logic.
   */
  var updateInfoCards = function(stats){
    $('.js-content-header span').text(stats.project.data.title);
    $('.js-content-header small').text(stats.project.name);

    $('.js-snapshot .info-box-number').text(stats.snapshot.progress + '%');
    $('.js-snapshot .progress-bar').width(stats.snapshot.progress + '%');
    $('.js-snapshot .progress-description').text(timeConverter(stats.snapshot.created));
    $('.js-snapshot').addClass(getInfoCardColour(99, 100, stats.snapshot.progress));

    if (stats.snapshot.progress < 100) {
      return;
    }

    $('.js-project-download .info-box-number').text(stats.project.downloads);
    $('.js-project-download').addClass(getInfoCardColour(0, 10000, stats.project.downloads));

    $('.js-project-comments .info-box-number').text(stats.comments.totalCount);
    $('.js-project-comments').addClass(getInfoCardColour(0, (stats.issues.totalCount * 5), stats.comments.totalCount));
    $('.js-project-issues .info-box-number').text(stats.issues.totalCount);
    var issueClosedPercent = 100;
    if (stats.issues.totalCount > 0) {
      issueClosedPercent = 100 *stats.issues.closedCount/stats.issues.totalCount;
      $('.js-project-issues .progress-bar').width((issueClosedPercent) + '%');
    };
    $('.js-project-issues .progress-description').text(stats.issues.openCount + ' open issues');
    $('.js-project-issues').addClass(getInfoCardColour(0, 100, issueClosedPercent));

    $('.js-project-open-issues .count').text(stats.issues.openCount);
    $('.js-project-open-issues').addClass(getInfoCardColour(50, 0, stats.issues.openCount));
    $('.js-project-open-issues a.issues-link').attr('href', 'https://www.drupal.org/project/issues/' + stats.project.name);
  }

  function barGraph(freqData, key) {

    function dashboard(id, fData){
        var width = $(id).width();
        var height = $(id).height();
        var histoGramWidth = width * 0.6;
        var histoGramHeight = height * 0.8;
        var pieChartWidth = width * 0.4;
        var pieChartHeight = height * 0.4;
        var legendWidth = width * 0.4;
        var legendHeight = height * 0.4;
        var barColor = '#30bbbb';
        function segColor(c){ return {males:"#0073b7", females:"#f012be", unknown:"#d2d6de"}[c]; }

        // compute total for each state.
        fData.forEach(function(d){d.total=d.freq.males+d.freq.females+d.freq.unknown;});

        // function to handle histogram.
        function histoGram(fD){
            var hG={},    hGDim = {t: 60, r: 0, b: 30, l: 0};
            hGDim.w = histoGramWidth - hGDim.l - hGDim.r,
            hGDim.h = histoGramHeight - hGDim.t - hGDim.b;

            //create svg for histogram.
            var hGsvg = d3.select(id).append("svg")
                .attr('class','histogram')
                .attr("width", hGDim.w + hGDim.l + hGDim.r)
                .attr("height", hGDim.h + hGDim.t + hGDim.b).append("g")
                .attr("transform", "translate(" + hGDim.l + "," + hGDim.t + ")");

            // create function for x-axis mapping.
            var x = d3.scale.ordinal().rangeRoundBands([0, hGDim.w], 0.1)
                    .domain(fD.map(function(d) { return d[0]; }));

            // Add x-axis to the histogram svg.
            hGsvg.append("g").attr("class", "x axis")
                .attr("transform", "translate(0," + hGDim.h + ")")
                .call(d3.svg.axis().scale(x).orient("bottom"));

            // Create function for y-axis map.
            var y = d3.scale.linear().range([hGDim.h, 0])
                    .domain([0, d3.max(fD, function(d) { return d[1]; })]);

            // Create bars for histogram to contain rectangles and freq labels.
            var bars = hGsvg.selectAll(".bar").data(fD).enter()
                    .append("g").attr("class", "bar");

            //create the rectangles.
            bars.append("rect")
                .attr("x", function(d) { return x(d[0]); })
                .attr("y", function(d) { return y(d[1]); })
                .attr("width", x.rangeBand())
                .attr("height", function(d) { return hGDim.h - y(d[1]); })
                .attr('fill',barColor)
                .on("mouseover",mouseover)// mouseover is defined bemales.
                .on("mouseout",mouseout);// mouseout is defined bemales.

            //Create the frequency labels above the rectangles.
            bars.append("text").text(function(d){ return d3.format(",")(d[1])})
                .attr("x", function(d) { return x(d[0])+x.rangeBand()/2; })
                .attr("y", function(d) { return y(d[1])-5; })
                .attr("text-anchor", "femalesdle");

            function mouseover(d){  // utility function to be called on mouseover.
                // filter for selected state.
                var st = fData.filter(function(s){ return s[key] == d[0];})[0],
                    nD = d3.keys(st.freq).map(function(s){ return {type:s, freq:st.freq[s]};});

                // call update functions of pie-chart and legend.
                pC.update(nD);
                leg.update(nD);
            }

            function mouseout(d){    // utility function to be called on mouseout.
                // reset the pie-chart and legend.
                pC.update(tF);
                leg.update(tF);
            }

            // create function to update the bars. This will be used by pie-chart.
            hG.update = function(nD, color){
                // update the domain of the y-axis map to reflect change in frequencies.
                y.domain([0, d3.max(nD, function(d) { return d[1]; })]);

                // Attach the new data to the bars.
                var bars = hGsvg.selectAll(".bar").data(nD);

                // transition the height and color of rectangles.
                bars.select("rect").transition().duration(500)
                    .attr("y", function(d) {return y(d[1]); })
                    .attr("height", function(d) { return hGDim.h - y(d[1]); })
                    .attr("fill", color);

                // transition the frequency labels location and change value.
                bars.select("text").transition().duration(500)
                    .text(function(d){ return d3.format(",")(d[1])})
                    .attr("y", function(d) {return y(d[1])-5; });
            }
            return hG;
        }

        // function to handle pieChart.
        function pieChart(pD){
            var pC ={},    pieDim ={w:pieChartWidth, h: pieChartHeight};
            pieDim.r = Math.min(pieDim.w, pieDim.h) / 2;

            // create svg for pie chart.
            var piesvg = d3.select(id).append("svg")
                .attr('class','pie-chart')
                .attr("width", pieDim.w).attr("height", pieDim.h).append("g")
                .attr("transform", "translate("+pieDim.w/2+","+pieDim.h/2+")");

            // create function to draw the arcs of the pie slices.
            var arc = d3.svg.arc().outerRadius(pieDim.r - 10).innerRadius(0);

            // create a function to compute the pie slice angles.
            var pie = d3.layout.pie().sort(null).value(function(d) { return d.freq; });

            // Draw the pie slices.
            piesvg.selectAll("path").data(pie(pD)).enter().append("path").attr("d", arc)
                .each(function(d) { this._current = d; })
                .style("fill", function(d) { return segColor(d.data.type); })
                .on("mouseover",mouseover).on("mouseout",mouseout);

            // create function to update pie-chart. This will be used by histogram.
            pC.update = function(nD){
                piesvg.selectAll("path").data(pie(nD)).transition().duration(500)
                    .attrTween("d", arcTween);
            }
            // Utility function to be called on mouseover a pie slice.
            function mouseover(d){
                // call the update function of histogram with new data.
                hG.update(fData.map(function(v){
                    return [v[key],v.freq[d.data.type]];}),segColor(d.data.type));
            }
            //Utility function to be called on mouseout a pie slice.
            function mouseout(d){
                // call the update function of histogram with all data.
                hG.update(fData.map(function(v){
                    return [v[key],v.total];}), barColor);
            }
            // Animating the pie-slice requiring a custom function which specifies
            // how the intermediate paths should be drawn.
            function arcTween(a) {
                var i = d3.interpolate(this._current, a);
                this._current = i(0);
                return function(t) { return arc(i(t));    };
            }
            return pC;
        }

        // function to handle legend.
        function legend(lD){
            var leg = {};

            // create table for legend.
            var legend = d3.select(id).append("table").attr('class','legend');

            // create one row per segment.
            var tr = legend.append("tbody").selectAll("tr").data(lD).enter().append("tr");

            // create the first column for each segment.
            tr.append("td").append("svg").attr("width", '16').attr("height", '16').append("rect")
                .attr("width", '16').attr("height", '16')
          .attr("fill",function(d){ return segColor(d.type); });

            // create the second column for each segment.
            tr.append("td").text(function(d){ return d.type;});

            // create the third column for each segment.
            tr.append("td").attr("class",'legendFreq')
                .text(function(d){ return d3.format(",")(d.freq);});

            // create the fourth column for each segment.
            tr.append("td").attr("class",'legendPerc')
                .text(function(d){ return getLegend(d,lD);});

            // Utility function to be used to update the legend.
            leg.update = function(nD){
                // update the data attached to the row elements.
                var l = legend.select("tbody").selectAll("tr").data(nD);

                // update the frequencies.
                l.select(".legendFreq").text(function(d){ return d3.format(",")(d.freq);});

                // update the percentage column.
                l.select(".legendPerc").text(function(d){ return getLegend(d,nD);});
            }

            function getLegend(d,aD){ // Utility function to compute percentage.
                return d3.format("%")(d.freq/d3.sum(aD.map(function(v){ return v.freq; })));
            }

            return leg;
        }

        // calculate total frequency by segment for all state.
        var tF = ['males','females','unknown'].map(function(d){
            return {type:d, freq: d3.sum(fData.map(function(t){ return t.freq[d];}))};
        });

        // calculate total frequency by state for all segment.
        var sF = fData.map(function(d){return [d[key],d.total];});

        var hG = histoGram(sF), // create the histogram.
            pC = pieChart(tF), // create the pie-chart.
            leg= legend(tF);  // create the legend.
    }
    dashboard('#user-container',freqData);

  }
  queue()
    .defer(d3.json, "data/" + QueryString.project + ".json")
    .await(ready);

  function ready(error, stats) {
    updateInfoCards(stats);
    if (stats.snapshot.progress < 100) {
      return;
    }

    var color = d3.scale.linear()
      .range(["hsl(62,100%,90%)", "hsl(228,30%,20%)"])
      .interpolate(d3.interpolateHcl);
    var worldStatsUndefinedCountry = (stats.world_stats[""]) ? stats.world_stats[""] : null;
    delete(stats.world_stats[""]);
    var worldStatsArray = Object.keys(stats.world_stats).map(function (key) { return stats.world_stats[key]; });
    var userActivityArray = Object.keys(stats.users.latest_activity).map(function (key) {
      return {
        year: stats.users.latest_activity[key].year,
        freq:{
          males:stats.users.latest_activity[key].males,
          females:stats.users.latest_activity[key].females,
          unknown:stats.users.latest_activity[key].unknown
        }
      };
    });
    var userAgeArray = Object.keys(stats.users.age).map(function (key) {
      return {
        age: stats.users.age[key].age,
        freq:{
          males:stats.users.age[key].males,
          females:stats.users.age[key].females,
          unknown:stats.users.age[key].unknown
        }
      };
    });
    var maxComments = Math.max.apply(Math,worldStatsArray.map(function(o){return o.commentsCount;}))
    var maxIssues = Math.max.apply(Math,worldStatsArray.map(function(o){return o.issuesCount;}))
    var maxTotal = Math.max.apply(Math,worldStatsArray.map(function(o){return o.totalCount;}))
    var maxUsers = Math.max.apply(Math,worldStatsArray.map(function(o){return o.usersCount;}))
    console.log(stats);
    var worldStatsMap = new Datamap({
      element: document.getElementById('map-container'),
      fills: {
        defaultFill: '#efefff'
      },
      data: stats.world_stats,
      geographyConfig: {
        borderColor:  '#dddddd',
        highlightBorderColor:  '#ffffff',
        popupTemplate: function(geo, data) {
          if (!data) {
            return;
          }
          return [
            '<ul class="list-group world-stats-info"><li class="list-group-item bg-aqua"><i class="fa fa-globe"></i>&nbsp;&nbsp;<strong>', geo.properties.name, '</strong></li>',
            '<li class="list-group-item">Issues <span class="badge">', data.issuesCount, '</span></li>',
            '<li class="list-group-item">Comments <span class="badge">', data.commentsCount, '</span></li>',
            '<li class="list-group-item">Users <span class="badge">', data.usersCount, '</span></li></ul>'
          ].join('');
        }
      }
    });

    $('#map-container-control li > a').click(function(event){
      event.stopPropagation();
      var $this = $(this);
      if ($this.parent().hasClass('active')) { return false};

      switch($this.attr('data-trigger')) {
        case 'total':
          color.domain([0, maxTotal]);
          worldStatsMap.updateChoropleth(createWorldStatsColorMap(stats.world_stats, color, 'totalCount'));
          break;

        case 'users':
          color.domain([0, maxUsers]);
          worldStatsMap.updateChoropleth(createWorldStatsColorMap(stats.world_stats, color, 'usersCount'));
          break;

        case 'issues':
          color.domain([0, maxIssues]);
          worldStatsMap.updateChoropleth(createWorldStatsColorMap(stats.world_stats, color, 'issuesCount'));
          break;

        case 'comments':
          color.domain([0, maxComments]);
          worldStatsMap.updateChoropleth(createWorldStatsColorMap(stats.world_stats, color, 'commentsCount'));
          break;

        default:
          return false;

      }
      $('#map-container-control li').removeClass('active');
      $this.parent().addClass('active');
      return false;
    });
    $('#map-container-control li:first > a').click();

    $('#user-container-control li > a').click(function(event){
      event.stopPropagation();
      var $this = $(this);
      if ($this.parent().hasClass('active')) { return false};

      switch($this.attr('data-trigger')) {
        case 'last-activity':
          barGraph(userActivityArray, 'year');
          break;

        case 'age':
          barGraph(userAgeArray, 'age');
          break;

        default:
          return false;

      }
      $('#user-container-control li').removeClass('active');
      $this.parent().addClass('active');
      return false;
    });
    $('#user-container-control li:first > a').click();


  }

})(jQuery);

