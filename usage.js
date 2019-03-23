/*global $, MtaBusTime */

function addBulletPoint(text) {
    var ul = document.getElementById('bustimes');
    var li = document.createElement("li");
    li.appendChild(document.createTextNode(text));
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
  var responseTime;
  $( "li" ).remove();
  mta.monitorStop('400657', '1', function (stop) {
    responseTime = new Date(stop.Siri.ServiceDelivery.ResponseTimestamp);
    var stopMonitoring = stop.Siri.ServiceDelivery.StopMonitoringDelivery;
    for (s of stopMonitoring){
      let line;
      let approximityTest;
      for (v of s.MonitoredStopVisit.slice(0,4)){
        let journey = v.MonitoredVehicleJourney;
        line = journey.PublishedLineName[0];
        approximityTest = journey.MonitoredCall.ArrivalProximityText;
        let stopsAway = journey.MonitoredCall.NumberOfStopsAway;
        let text = line + ' is ' + stopsAway + ' stops away';
        addBulletPoint(text);
      }
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
  getData();
  loop(30, 0, new Date());
});