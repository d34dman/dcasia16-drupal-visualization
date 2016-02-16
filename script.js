/**
 * @file
 *   Javascript that initializes visualizations on the page.
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

  queue()
    .defer(d3.json, "data/" + QueryString.project + ".json")
    .await(ready);

  function ready(error, stats) {
    console.log(stats);
    debugger;
    var map = new Datamap({
      element: document.getElementById('map-container'),
      fills: {
        HIGHEST: '#0678be',
        HIGH: '#129FF8',
        LOW: '#39AFF9',
        LOWEST: '#74C7FB',
        defaultFill: '#FFFFFF'
      },
      data: stats.world_stats,
      geographyConfig: {
        highlightFillColor: function(geo) {
          return geo['fillKey'] || '#FFFFFF';
        },
        popupTemplate: function(geo, data) {
          if (!data) {
            return;
          }
          return ['<div class="hoverinfo bg-yellow">',
            '<strong>', geo.properties.name, '</strong>',
            '&nbsp;&nbsp;(<i>', data.totalCount, '</i>)',
            '<br>Issues: <strong>', data.issuesCount, '</strong>',
            '<br>Comments: <strong>', data.commentsCount, '</strong>',
            '</div>'].join('');
        }
      }
    });
  }
