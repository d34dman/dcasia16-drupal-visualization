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
        case 'interactions':
          break;

        case 'gender':
          break;

        case 'last-activity':
          break;

        case 'age':
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

