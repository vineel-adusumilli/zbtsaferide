// Utility function to format time to AM/PM
function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  return hours + ':' + minutes + ' ' + ampm;
}

$(document).ready(function() {
  var map = L.mapbox.map('map', 'vineel.i06b0oh9').setView([42.35, -71.11], 17);
  map.legendControl.addLegend(document.getElementById('legend-content').innerHTML);

  // Draw Saferide route
  $.get('http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=mit&r=saferidebostonw', function(data) {
    var $xml = $(data);
    
    // Populate the stops
    $xml.find('stop').each(function() {
      if ($(this).attr('lat')) {
        L.circleMarker([parseFloat($(this).attr('lat')),
          parseFloat($(this).attr('lon'))],
          {color: 'white', fill: true, fillOpacity: 0.7}).addTo(map);
      }
    });

    // Draw the path
    $xml.find('path').each(function() {
      var polyline = L.polyline([], {color: 'white'}).addTo(map);
      $(this).find('point').each(function() {
        polyline.addLatLng([parseFloat($(this).attr('lat')),
          parseFloat($(this).attr('lon'))]);
      });
    });
  });

  // Function that plots the shuttle and updates the times
  var shuttle = L.circleMarker([42.35, -71.11], 
      {fill: true, fillOpacity: 1, radius: 30}).addTo(map);
  function updatePosition() {
    // Update the times
    $.get('http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=mit&r=saferidebostonw&s=manc58', function(data) {
      var $xml = $(data);
      var prediction = $($xml.find('prediction').first());

      $('#time').html(formatAMPM(new Date()));

      var minutes = parseInt(prediction.attr('minutes'));
      $('#nextmin').html(minutes + ' minute' + (minutes == 1 ? '' : 's'));

      var nexttime = parseInt(prediction.attr('epochTime'));
      $('#nexttime').html(formatAMPM(new Date(nexttime)));
    });

    // Plot the shuttle
    $.get('http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=mit&r=saferidebostonw&t=0', function(data) {
      var $xml = $(data);

      var vehicle = $($xml.find('vehicle').first());
      var latLng = [parseFloat(vehicle.attr('lat')),
        parseFloat(vehicle.attr('lon'))];
      shuttle.setLatLng(latLng);
      map.panTo(latLng, {duration: 4});
    });
  }

  updatePosition();
  setInterval(updatePosition, 10000);
});

