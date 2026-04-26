/*global $, MtaBusTime */

var stops = [
  { id: '405415', direction: '1', label: '125th & Malcolm X (Westbound)' },
  { id: '403122', direction: '0', label: '116th & Broadway (Eastbound)' }
];

var currentStopIndex = 0;

function addBulletPoint(text) {
    var ul = document.getElementById('bustimes');
    var li = document.createElement("li");
    li.innerHTML = text;
    ul.appendChild(li);
}

function startTime(from) {
  document.getElementById('timestamp').innerHTML = 'As of ' + timeSince(from) + ' ago:';
}

function timeSince(date) {

  var seconds = Math.floor((new Date() - date) / 1000);

  var interval = Math.floor(seconds / 31536000);

  if (interval > 1) {
    return interval + " years";
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + " months";
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval + " days";
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return interval + " hours";
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval + " minutes";
  }
  return Math.floor(seconds) + " seconds";
}

function getData(seconds) {
  var apiKey = "a4b4e4cf-8ee0-48d0-b63b-328f3c47aca5"; // <-- TODO: Bad Bad Bad! Fix.
  var mta = new MtaBusTime(apiKey);
  var stop = stops[currentStopIndex];
  var responseTime;
  $( "li" ).remove();
  mta.monitorStop(stop.id, stop.direction, function (data) {
    responseTime = new Date(data.Siri.ServiceDelivery.ResponseTimestamp);
    var stopMonitoring = data.Siri.ServiceDelivery.StopMonitoringDelivery;
    var found = 0;
    for (s of stopMonitoring){
      if (!s.MonitoredStopVisit) continue;
      for (v of s.MonitoredStopVisit){
        let journey = v.MonitoredVehicleJourney;
        let line = journey.PublishedLineName[0];
        if (!line.includes('M60')) continue;
        if (found >= 4) break;
        found++;
        let stopsAway = journey.MonitoredCall.NumberOfStopsAway;
        let proximityText = journey.MonitoredCall.ArrivalProximityText;
        let text = '<em class="busline">' + line + '</em>' + ' — ' +
          '<em class="stopsaway">' + proximityText + '</em>' +
          ' (' + stopsAway + ' stop' + (stopsAway === 1 ? '' : 's') + ' away)';
        addBulletPoint(text);
      }
    }
    if (found === 0) {
      addBulletPoint('No buses currently scheduled.');
    }
  });
}

function loop(seconds, iter, time) {
  if(iter >= seconds){
    getData();
    time = new Date();
    iter = 0
  }

  startTime(time);

  setTimeout(function(){ loop(seconds, iter+1, time); }, 1000);
};


$(function() {
  $('#direction-toggle').on('click', function() {
    currentStopIndex = 1 - currentStopIndex;
    var current = stops[currentStopIndex];
    var other = stops[1 - currentStopIndex];
    $('#stop-title').text(current.label);
    $('#direction-toggle').text('Switch to ' + other.label);
    getData();
  });

  getData();
  loop(30, 0, new Date());
});