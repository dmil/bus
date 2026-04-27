/*global $, MtaBusTime */

var stops = [
  {
    id: '405415',
    direction: '1',
    label: '125th & Malcolm X (Westbound)',
    routeStops: [
      { id: '405414', name: '2 Av' },
      { id: '405419', name: 'Lex Av' },
      { id: '405473', name: 'Park Av' },
      { id: '405415', name: 'Malcolm X' },
      { id: '405426', name: 'Fred. D.' },
      { id: '405079', name: 'Amst. Av' }
    ]
  },
  {
    id: '403122',
    direction: '0',
    label: '116th & Broadway (Eastbound)',
    routeStops: [
      { id: '403117', name: '106 St' },
      { id: '403122', name: '116 St' },
      { id: '404262', name: '120 St' }
    ]
  }
];

var currentStopIndex = 0;

function addBulletPoint(text) {
  var ul = document.getElementById('bustimes');
  var li = document.createElement('li');
  li.innerHTML = text;
  ul.appendChild(li);
}

function startTime(from) {
  document.getElementById('timestamp').innerHTML = 'As of ' + timeSince(from) + ' ago:';
}

function timeSince(date) {
  var seconds = Math.floor((new Date() - date) / 1000);
  var interval = Math.floor(seconds / 31536000);
  if (interval > 1) { return interval + ' years'; }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) { return interval + ' months'; }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) { return interval + ' days'; }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) { return interval + ' hours'; }
  interval = Math.floor(seconds / 60);
  if (interval > 1) { return interval + ' minutes'; }
  return Math.floor(seconds) + ' seconds';
}

function renderRouteDiagram(stopsAwayList) {
  var config = stops[currentStopIndex];
  var routeStops = config.routeStops;
  var selectedIndex = routeStops.findIndex(function(s) { return s.id === config.id; });
  var n = routeStops.length;

  var W = 500, H = 72;
  var margin = 30;
  var lineY = 30;
  var busY = 10;
  var labelY = 52;
  var dotR = 5;
  var selR = 7;
  var spacing = (W - 2 * margin) / (n - 1);

  var busAt = {};
  stopsAwayList.forEach(function(sa) {
    var idx = selectedIndex - sa;
    if (idx >= 0 && idx < n) {
      busAt[idx] = (busAt[idx] || 0) + 1;
    }
  });

  var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg"'
    + ' style="width:100%;display:block;font-family:Helvetica Neue,Helvetica,sans-serif">';

  svg += '<line x1="' + margin + '" y1="' + lineY + '" x2="' + (W - margin) + '" y2="' + lineY
    + '" stroke="#ddd" stroke-width="2.5"/>';

  routeStops.forEach(function(rs, i) {
    var x = margin + i * spacing;
    var isSelected = rs.id === config.id;
    var buses = busAt[i] || 0;

    if (buses > 0) {
      svg += '<circle cx="' + x + '" cy="' + busY + '" r="5" fill="#EB3F1E"/>';
      svg += '<line x1="' + x + '" y1="' + (busY + 5) + '" x2="' + x + '" y2="' + (lineY - dotR)
        + '" stroke="#EB3F1E" stroke-width="1" stroke-dasharray="2,2"/>';
      if (buses > 1) {
        svg += '<text x="' + (x + 7) + '" y="' + (busY + 4)
          + '" font-size="9" fill="#EB3F1E">\xd7' + buses + '</text>';
      }
    }

    var r = isSelected ? selR : dotR;
    var fill = isSelected ? '#ACB03D' : '#bbb';
    svg += '<circle cx="' + x + '" cy="' + lineY + '" r="' + r + '" fill="' + fill + '"/>';

    var anchor = i === 0 ? 'start' : (i === n - 1 ? 'end' : 'middle');
    var weight = isSelected ? '600' : 'normal';
    svg += '<text x="' + x + '" y="' + labelY + '" text-anchor="' + anchor
      + '" font-size="11" fill="#555" font-weight="' + weight + '">' + rs.name + '</text>';
  });

  svg += '</svg>';
  $('#route-diagram').html(svg);
}

function getData() {
  var apiKey = "a4b4e4cf-8ee0-48d0-b63b-328f3c47aca5"; // <-- TODO: Bad Bad Bad! Fix.
  var mta = new MtaBusTime(apiKey);
  var stop = stops[currentStopIndex];
  $('li').remove();
  mta.monitorStop(stop.id, stop.direction, function(data) {
    var stopMonitoring = data.Siri.ServiceDelivery.StopMonitoringDelivery;
    var m60buses = [];
    for (var s of stopMonitoring) {
      if (!s.MonitoredStopVisit) continue;
      for (var v of s.MonitoredStopVisit) {
        var journey = v.MonitoredVehicleJourney;
        if (!journey.PublishedLineName[0].includes('M60')) continue;
        m60buses.push(journey);
      }
    }

    if (m60buses.length === 0) {
      addBulletPoint('No buses currently scheduled.');
    } else {
      m60buses.slice(0, 4).forEach(function(journey) {
        var stopsAway = journey.MonitoredCall.NumberOfStopsAway;
        var expectedTime = journey.MonitoredCall.ExpectedArrivalTime;
        var minAway = expectedTime
          ? Math.max(0, Math.round((new Date(expectedTime) - new Date()) / 60000))
          : null;
        var timeStr = minAway !== null ? minAway + ' min' : stopsAway + ' stops';
        var text = '<em class="busline">' + journey.PublishedLineName[0] + '</em> &mdash; '
          + '<em class="stopsaway">' + timeStr + '</em>'
          + ' (' + stopsAway + ' stop' + (stopsAway === 1 ? '' : 's') + ' away)';
        addBulletPoint(text);
      });
    }

    renderRouteDiagram(m60buses.map(function(j) { return j.MonitoredCall.NumberOfStopsAway; }));
  });
}

function loop(seconds, iter, time) {
  if (iter >= seconds) {
    getData();
    time = new Date();
    iter = 0;
  }
  startTime(time);
  setTimeout(function() { loop(seconds, iter + 1, time); }, 1000);
}

function applyStop(index) {
  currentStopIndex = index;
  var current = stops[currentStopIndex];
  var other = stops[1 - currentStopIndex];
  $('#stop-title').text(current.label);
  $('#direction-toggle').text('Switch to ' + other.label);
  window.location.hash = current.id;
  renderRouteDiagram([]);
  getData();
}

$(function() {
  var hashId = window.location.hash.replace('#', '');
  var initialIndex = stops.findIndex(function(s) { return s.id === hashId; });
  if (initialIndex !== -1) {
    currentStopIndex = initialIndex;
    var current = stops[currentStopIndex];
    var other = stops[1 - currentStopIndex];
    $('#stop-title').text(current.label);
    $('#direction-toggle').text('Switch to ' + other.label);
  }

  $('#direction-toggle').on('click', function() {
    applyStop(1 - currentStopIndex);
  });

  renderRouteDiagram([]);
  getData();
  loop(30, 0, new Date());
});
