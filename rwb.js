//
// Global state
//
// map     - the map object
// usermark- marks the user's position on the map
// markers - list of markers on the current map (not including the user position)
// 
//

//
// First time run: request current location, with callback to Start
//
if (navigator.geolocation)  {
    navigator.geolocation.getCurrentPosition(Start);
}

function componentToHex(c) {
// Source: http://stackoverflow.com/a/5624139
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(r, g, b) {
// Source: http://stackoverflow.com/a/5624139
    return componentToHex(r) + componentToHex(g) + componentToHex(b);
}


function UpdateMapById(id, tag) {

  var target = document.getElementById(id);
  if (target != null) {
    var data = target.innerHTML;

    console.log("Data: " + data.toString());

    var rows  = data.split("\n");
    for (i in rows) {
    var cols = rows[i].split("\t");
    var lat = cols[0];
    var long = cols[1];

    if (tag=="OPINION") {
      if (cols[2]<0){ // Opinion is red
        var rgb = new Array(Math.round(cols[2]*-1*255),0,0);
      }
      else if (cols[2]>0){ // Opinion is blue
        var rgb = new Array(0,0,Math.round(cols[2]*255));
      }
      else { // Opinion is nothing
        var rgb = new Array(0,255,0);
      }
      var pinColor = rgbToHex(rgb[0],rgb[1],rgb[2]);
      // console.log("COLOR: "+hex+"/"+rgb[0].toString()+"-"+rgb[1].toString()+"-"+rgb[2].toString());
      var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
        new google.maps.Size(21, 34),
        new google.maps.Point(0,0),
        new google.maps.Point(10, 34));
    } else {
      var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + "eeeeee",
        new google.maps.Size(21, 34),
        new google.maps.Point(0,0),
        new google.maps.Point(10, 34)); 
    }

    console.log("Updating index: " + i.toString());

	  markers.push(new google.maps.Marker({ map:map,
						    position: new google.maps.LatLng(lat,long),
						    icon: pinImage, title: tag+"\n"+cols.join("\n")}));
	
    }
  }
}

function ClearMarkers()
{
    // clear the markers
    while (markers.length>0) { 
	markers.pop().setMap(null);
    }
}


function UpdateDisplay(id) {
var target = document.getElementById(id);
  if (target != null) {
    var data = target.innerHTML;
    var color = document.getElementById("color");
    var rows  = data.split("\n");
    var total = 0.00;
    var dem = 0.00;
    var rep = 0.00;
    console.log("initial total: " +total);
    
    for (i in rows) {
      var cols = rows[i].split("\t");
      total += Number(cols[0]);
      console.log("temp total: " + total);
      if (cols[1] == "DEM") dem = Number(cols[0]);
      if (cols[1] == "REP") rep = Number(cols[0]);
    }

    console.log("total: " + total);
    console.log("dem: " + dem + " rep: " + rep);
    color.innerHTML+="<p>Total amount of money involved in current view: $" + total+"";
    
    color.style.backgroundColor = String(colorScale(dem, rep));
	}
}

function colorScale(blue, red) {
  var sum = blue + red;
  if (sum === 0) return '#888888';

  var blueColor = 255 * (blue / sum);
  var redColor = 255 * (red / sum);

  var rgb = blueColor | (0 << 8) | (redColor << 16);
  var rgbString = rgb.toString(16)
  var length = rgbString.length;
  if (length < 6) {
    var temp = "";
    for (i = 0; i < 6 - length; i++) {
      temp = temp + "0";
    }
    rgbString = temp + rgbString;
  }
  console.log('#' + rgbString);
  return '#' + rgbString;
}

function UpdateOpinionDisplay(id) {
var target = document.getElementById(id);
  if (target != null) {
    var data = target.innerHTML;
    var color = document.getElementById("color");
    var rows  = data.split("\n");
    var cols = rows[0].split("\t");
    var average = Number(cols[1]);
    var stddev = Number(cols[0]);
    color.innerHTML+="<p>Average color in current view: "+average+" | Standard deviation color in current view: "+stddev+"";
    var colorVal = '';
    if (average > 0.0) {
      colorVal = "#0000" + parseInt(255*average).toString(16);
    }
    else if (average == 0.0) {
      colorVal = '#ffffff';
    }
    else {
      colorVal = "#" + parseInt(255*average*-1).toString(16) + "0000";
    }
    color.style.backgroundColor = String(colorVal);
    console.log(colorVal);
  }
}

function UpdateMap()
{
    var color = document.getElementById("color");
    
    //color.innerHTML="<b><blink>Updating Display...</blink></b>";
    //color.style.backgroundColor='white';

    ClearMarkers();

    UpdateMapById("committee_data","COMMITTEE");
    UpdateMapById("candidate_data","CANDIDATE");
    UpdateMapById("individual_data", "INDIVIDUAL");
    UpdateMapById("opinion_data","OPINION");

    if ($("#aopinion").is(':checked')) { UpdateOpinionDisplay("opinion_analysis"); }
    if ($("#acommittee").is(':checked')) { UpdateDisplay("committee_analysis"); }

    //color.innerHTML="Ready";
    //UpdateDisplay("committee_analysis");
    //UpdateOpinionDisplay("opinion_analysis");
    /*if (Math.random()>0.5) { 
	color.style.backgroundColor='blue';
    } else {
	color.style.backgroundColor='red';
    }*/

}

function NewData(data)
{
  var target = document.getElementById("data");
  if (target != null) { 
    target.innerHTML = data;

    UpdateMap();
  }
}

function ViewShift()
{
    var bounds = map.getBounds();

    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();

    var color = document.getElementById("color");

    color.innerHTML="<b><blink>Querying...("+ne.lat()+","+ne.lng()+") to ("+sw.lat()+","+sw.lng()+")</blink></b>";
    color.style.backgroundColor='white';
   
    var what = findCheckboxes();
    var cycles = findCycles($("#election-cycle-checkboxes").find('input'));

    $.get("rwb.pl?act=near&latne="+ne.lat()+"&longne="+ne.lng()+"&latsw="+sw.lat()+"&longsw="+sw.lng()+"&format=raw&what="+what+"&cycle="+cycles,NewData);

    // Update the give opinion date link with the latitude and longitude of the center of the map
    var latitude = (ne.lat() + sw.lat()) / 2;
    var longitude = (ne.lng() + sw.lng()) / 2;
    $("#give-opinion-link").attr('href',"rwb.pl?act=give-opinion-data&lat="+latitude+"&long="+longitude);
}


function Reposition(pos)
{
    var lat=pos.coords.latitude;
    var long=pos.coords.longitude;

    map.setCenter(new google.maps.LatLng(lat,long));
    usermark.setPosition(new google.maps.LatLng(lat,long));
}


function Start(location) 
{
  var lat = location.coords.latitude;
  var long = location.coords.longitude;
  var acc = location.coords.accuracy;
  
  var mapc = $( "#map");

  map = new google.maps.Map(mapc[0], 
			    { zoom:16, 
				center:new google.maps.LatLng(lat,long),
				mapTypeId: google.maps.MapTypeId.ROADMAP
				} );

  usermark = new google.maps.Marker({ 
              map:map,
					    position: new google.maps.LatLng(lat,long),
					    title: 'You are here',
              icon: 'http://maps.google.com/mapfiles/marker_white.png'
            });

  markers = new Array;

  var color = document.getElementById("color");
  color.style.backgroundColor='white';
  color.innerHTML="<b><blink>Waiting for first position</blink></b>";

  google.maps.event.addListener(map,"bounds_changed",ViewShift);
  google.maps.event.addListener(map,"center_changed",ViewShift);
  google.maps.event.addListener(map,"zoom_changed",ViewShift);

  navigator.geolocation.watchPosition(Reposition);

}

function findCheckboxes() {
  var what = "";
   
  if ($("#committee").is(':checked')) {
    if (what == "") { what += "committees"; }
    else { what += ",committees"; }
    $("#acommittee").removeAttr("disabled");
  }
  else {
    $("#acommittee").attr("disabled", true);
    $("#acommittee").attr("checked", false);
  }
  
  if ($("#opinion").is(':checked')) {
    if (what == "") { what += "opinions"; }
    else { what += ",opinions"; }
    $("#aopinion").removeAttr("disabled");
  }
  else {
    $("#aopinion").attr("disabled", true);
    $("#aopinion").attr("checked", false);
  }

  if ($("#candidate").is(':checked')) {
    if (what == "") { what += "candidates"; }
    else { what += ",candidates"; }
  }

  if ($("#individual").is(':checked')) {
    if (what == "") { what += "individuals"; }
    else { what += ",individuals"; }
    $("#aindividual").removeAttr("disabled");
  }  
  else {
    $("#aindividual").attr("disabled", true);
    $("#aindividual").attr("checked", false);
  }
  //console.log(what);
  return what;
}

function findCycles($cycles) {
  var cyclesArray = [];
  $cycles.each(function() {
    if ($(this).is(':checked')) {
      //console.log($(this));
      var value = String($(this).val());
      cyclesArray.push(value);
    }
  });
  if (cyclesArray.length > 0) {
    return cyclesArray.join(",");
  } else {
    return "";
  }
}

// Get all of the checkboxes for the filters
$filters = $("#opinion, #committee, #candidate, #individual");
// Get all of the checkboxes for the cycles
$cycles = $("#election-cycle-checkboxes").find('input');

// Handle whenever a checkbox is changed
$filters.add($cycles).live('change', function() {
  ClearMarkers();
  
  var bounds = map.getBounds();
  var ne = bounds.getNorthEast();
  var sw = bounds.getSouthWest();

  var what = findCheckboxes();
  var cycles = findCycles($("#election-cycle-checkboxes").find('input'));
  
  $.get("rwb.pl?act=near&latne="+ne.lat()+"&longne="+ne.lng()+"&latsw="+sw.lat()+"&longsw="+sw.lng()+"&format=raw&what="+what+"&cycle="+cycles,NewData);

  //console.log("rwb.pl?act=near&latne="+ne.lat()+"&longne="+ne.lng()+"&latsw="+sw.lat()+"&longsw="+sw.lng()+"&format=raw&what="+what+"&cycle="+cycles);
});

$("#aopinion").live('change', function() {
  if ($("#aopinion").is(':checked')) {
    UpdateOpinionDisplay("opinion_analysis"); 
    $("#aindividual").attr("checked", false);
    $("#acommittee").attr("checked", false);
  }  
});

$("#acommittee").live('change', function() {
  if ($("#acommittee").is(':checked')) {
    UpdateDisplay("committee_analysis");
    $("#aindividual").attr("checked", false);
    $("#aopinion").attr("checked", false);
  }
});

$("#aindividual").live('change', function() {
  if ($("#aindividual").is(':checked')) {
    $("#acommittee").attr("checked", false);
    $("#aopinion").attr("checked", false);
  }
});