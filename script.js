queue()
.defer(d3.json, "data/drupal.json")
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
// don't change color on mouse hover
highlightFillColor: function(geo) {
return geo['fillKey'] || '#FFFFFF';
},
popupTemplate: function(geo, data) {
// don't show tooltip if country don't present in dataset
if (!data) { return ; }
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
