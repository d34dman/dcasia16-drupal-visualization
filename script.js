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
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
  }
  /**
   * Visualization Logic.
   */
  var updateInfoCards = function(stats){
    $('.js-snapshot .info-box-number').text(stats.snapshot.progress + '%') ;
    $('.js-snapshot .progress-bar').width(stats.snapshot.progress + '%') ;
    $('.js-snapshot .progress-description').text(timeConverter(stats.snapshot.created));

    $('.js-project-download .info-box-number').text(stats.project.downloads);

    $('.js-project-comments .info-box-number').text(stats.comments.totalCount);
    $('.js-project-issues .info-box-number').text(stats.issues.totalCount);
    if (stats.issues.totalCount > 0) {
      $('.js-project-issues .progress-bar').width((100 *stats.issues.closedCount/stats.issues.totalCount) + '%');
    };
    $('.js-project-issues .progress-description').text(stats.issues.openCount + ' open issues');

    $('.js-project-open-issues .count').text(stats.issues.openCount);
    $('.js-project-open-issues a.issues-link').attr('href', 'https://www.drupal.org/project/issues/' + stats.project.name);
  }

  queue()
    .defer(d3.json, "data/" + QueryString.project + ".json")
    .await(ready);

  function ready(error, stats) {
    updateInfoCards(stats);
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

})(jQuery);

