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
  var map = L.mapbox.map('map', 'vineel.i06b0oh9').setView([42.35, -71.11], 15);
  map.legendControl.addLegend(document.getElementById('legend-content').innerHTML);

  // Draw Saferide route
  var routeLayer = L.layerGroup([]).addTo(map);
  var shuttle = L.circleMarker([42.35, -71.11], 
      {fill: true, fillOpacity: 1, radius: 30});
  function drawRoute(route) {
    $.get('http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=mit&r=saferideboston' + route, function(data) {
      // Reset any markers/paths that were drawn before
      routeLayer.clearLayers();
      var $xml = $(data);
      
      // Populate the stops
      $xml.find('stop').each(function() {
        if ($(this).attr('lat')) {
          var marker = L.circleMarker([parseFloat($(this).attr('lat')),
            parseFloat($(this).attr('lon'))],
            {color: 'white', fill: true, fillOpacity: 0.7});
          routeLayer.addLayer(marker);
        }
      });

      // Draw the path
      $xml.find('path').each(function() {
        var polyline = L.polyline([], {color: 'white'});
        $(this).find('point').each(function() {
          polyline.addLatLng([parseFloat($(this).attr('lat')),
            parseFloat($(this).attr('lon'))]);
        });
        routeLayer.addLayer(polyline);
      });
      routeLayer.addLayer(shuttle);
    });
  }

  // Get the current position of the saferide
  function getSaferidePosition(route) {
    var latLng = null;
    $.ajax({
      url: 'http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=mit&t=0&r=saferideboston' + route,
      success:
        function(data) {
          var $xml = $(data);

          var vehicle = $($xml.find('vehicle').first());
          latLng = [parseFloat(vehicle.attr('lat')),
            parseFloat(vehicle.attr('lon'))];
          latLng = latLng[0] ? latLng : null;
        },
      async: false
    });
    return latLng;
  }

  // Get prediction info from NextBus
  function getPredictionInfo(route) {
    var predictionInfo = null;
    $.ajax({
      url: 'http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=mit&s=manc58&r=saferideboston' + route,
      success:
        function(data) {
          var $xml = $(data);
          var prediction = $($xml.find('prediction').first());

          var minutes = parseInt(prediction.attr('minutes'));
          var nexttime = parseInt(prediction.attr('epochTime'));
          predictionInfo = [minutes, nexttime];
          prediction = predictionInfo[0] ? predictionInfo : null;
        },
      async: false
    });

    return predictionInfo;
  }

  // Function that plots the shuttle and updates the times
  var oldRoute = null;
  function updatePosition() {
    // Check Boston West and then Boston All to see if they're running and update shuttle if so
    var latLng;
    var route = null;
    if (latLng = getSaferidePosition('w')) {
      route = 'w';
      shuttle.setLatLng(latLng);
      map.panTo(latLng, {duration: 4});
    } else if (latLng = getSaferidePosition('all')) {
      route = 'all';
      shuttle.setLatLng(latLng);
      map.panTo(latLng, {duration: 4});
    }

    // Update the time display
    $('#time').text(formatAMPM(new Date()));

    if (route !== oldRoute) {
      console.log("Route changed");
      // Update the route drawing if it's changed
      if (route) {
        drawRoute(route);
        map.setZoom(17);

        $('.legend-title').text('Saferide Boston ' + (route === 'w' ? 'West' : 'All'));
        $('.prediction').show();
      } else {
        routeLayer.clearLayers();
        console.log("Clearing");
        map.setZoom(15);
        map.panTo([42.35, -71.11]);

        $('.legend-title').text('Saferide Not Running');
        $('.prediction').show();
      }
      oldRoute = route;
    }

    // Update prediction information
    if (route) {
      var prediction = getPredictionInfo(route);
      $('#nextmin').text(prediction[0] + ' minute' + (prediction[0] === 1 ? '' : 's'));
      $('#nexttime').text(formatAMPM(new Date(prediction[1])));
    }
  }

  updatePosition();
  setInterval(updatePosition, 10000);
});

