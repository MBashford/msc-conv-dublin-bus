$(document).ready(function () {

  // load twitter
  if(typeof twttr != 'undefined'){
    twttr.widgets.load();
  }
  // .off ensures onclicks are not added multiple times
  $(document).off("click.routes");

  // Remove routes when navigating to another tab
  $(document).on("click.routes", "#routeplanner-nav, #allroutes-nav, #tourist-nav, #allroutes-tab, #tourist-tab, #routeplanner-tab",
    removeLineFromMap);

  // initialise all tooltips
  $(function () {
    $('[data-toggle="tooltip"]').tooltip()
  })

  // call geolocation function when button clicked
  $('#geolocation-routeplanner').on('click', function(){
    getGeolocation('origin');
    $('.geo-spinner').show();
});

  // flatpickr date https://flatpickr.js.org/options/
  $("#datepicker-tab1").flatpickr({
    altInput: true,
    altFormat: "F j, Y",
    dateFormat: 'yy-m-d',
    defaultDate: new Date(),
    minDate: "today"
  });

  // flatpickr time
  $('#timepicker-tab1').flatpickr({
    enableTime: true,
    defaultDate: new Date().getHours() + ":" + new Date().getMinutes(),
    dateFormat: 'H:i',
    noCalendar: true,
    time_24hr: true,
    minTime: "05:00",
    minuteIncrement: 1
  });
 
});

 //using google map autocomplete for the address          
 var input1 = document.getElementById('origin');
 var input2 = document.getElementById("destination");
 var options = { componentRestrictions: { country: "ie" }, types: ['geocode'] };
 var origin;
 var destination;

// wait until google is loaded
function WhenGoogleLoadedDo(fnt)
   {
   if(typeof google != 'undefined')
      fnt();
   else
      setTimeout(function()
         {(function(fnt)
            {
            WhenGoogleLoadedDo(fnt)
            })(fnt)}, 500); 
   }

WhenGoogleLoadedDo( () => {
  origin = new google.maps.places.Autocomplete(input1, options);
  destination = new google.maps.places.Autocomplete(input2, options);
});

$("#origin").on("input", function () {
  $('.geo-error').hide();
});


// function to create a marker for the bus station nearby from the user location 
function createMarker(place) {
  var marker = new google.maps.Marker({
    map: map,
    icon: "http://maps.google.com/mapfiles/ms/micons/bus.png",
    position: place.geometry.location
  });

  google.maps.event.addListener(marker, 'click', function () {
    infowindow.setContent(place.name);
    infowindow.open(map, this);
  });
}

//the starting location   
var starting_lat;
var starting_lng;

// destination location 
var ending_lat;
var ending_lng;
var directionsRenderer;
var allMarkers = [];

function removeLineFromMap() {
  if (directionsRenderer) {
    directionsRenderer.setDirections({ routes: [] });
  }
  // First, remove any existing markers from the map.
  console.log(allMarkers);
  if(allMarkers) {
    for (var i = 0; i < allMarkers.length; i++) {
      allMarkers[i].setMap(null);
    }
  }
}

// The routes function that shows the route 
function routes() {
  var markerArray = [];

  //getting the lat and lng of the input address 
  var starting = origin.getPlace();
  var ending = destination.getPlace();

  //starting address latitude
  starting_lat = starting.geometry.location.lat();
  starting_lng = starting.geometry.location.lng();

  //destination address longitude   
  ending_lat = ending.geometry.location.lat();
  ending_lng = ending.geometry.location.lng();


  // Create a map and center it on starting point
  var center = new google.maps.LatLng(starting_lat, starting_lng);

  // map.panTo(center);

  // Create a renderer for directions and bind it to the map.
  directionsRenderer = new google.maps.DirectionsRenderer({ map: map, preserveViewport: true });

  // Instantiate an info window to hold step text.
  var stepDisplay = new google.maps.InfoWindow;

  // Display the route between the initial start and end selections.
  calculateAndDisplayRoute(directionsRenderer, directionsService, markerArray, stepDisplay, map);
}


// calculating and showing the bus routes
function calculateAndDisplayRoute(directionsRenderer, directionsService, markerArray, stepDisplay, map) {



  // Retrieve the start and end locations and create a DirectionsRequest using
  // Bus directions.
  directionsService.route({
    origin: document.getElementById('origin').value,
    destination: document.getElementById('destination').value,
    travelMode: 'TRANSIT',
    transitOptions: {
      modes: ['BUS'],
      routingPreference: 'FEWER_TRANSFERS',
      // departure_time: "17:44:2"
    }
  },

    // showing the response received in a text format 
    function (response, status) {
      console.log(response)

      // markers for each step.
      if (status === 'OK') {

        map.fitBounds(response.routes[0].bounds);
        if($(window).width() >= 992){
          map.panBy(-600, 0);
          map.setZoom(map.getZoom() - 1);
        }
        //trimming the origin address
        startingAddress = response.routes[0].legs[0].start_address;
        address1 = startingAddress.split(',');
        address1 = address1[0];

        //trimming the destination address
        endingAddress = response.routes[0].legs[0].end_address;
        address2 = endingAddress.split(',');
        address2 = address2[0];


        // fill journey details into summary results
        $("#origin-tab1").html(address1);
        $("#destination-tab1").html(address2);

        journeysteps = response.routes[0].legs[0].steps;

        var direction_text = $("#direction");
        var journey_list = []
        var bus_details = []; //array to store each bus journey 


        var datetimeValue = $("#datetime-tab1").val();
        var arr = datetimeValue.split('T');
        var date1 = arr[0];
        var input_time = arr[1];


        // convert time to seconds since midnight
        // console.log("time: "+ input_time);
        var timeSplit = input_time.split(':');
        var timeSeconds = (+timeSplit[0]) * 60 * 60 + (+timeSplit[1]) * 60;

        var prediction = 0;


        for (var i = 0; i < journeysteps.length; i++) {
          // the route distance
          var distance = '';

          // the route instruction example (walk , take bus)
          var instruction = '';

          // the departing stop
          var departure_stop = '';

          // the arival stop	
          var arrival_stop = '';

          // the number of stops between arrival and departing stop
          var num_stops = '';

          // the walking duration , we will predict the bus one 
          var duration = '';

          // the bus number user take
          var Route_number = '';

          var arrival_latlng;
          var departure_latlng;



          // going through the repsone recieved from google
          var travelMode = journeysteps[i].travel_mode;


          //picture
          var bus = ("<img src=static/journeyplanner/icons/com.nextbus.dublin.jpg width=25 height=25>");
          var walking = ("<img src=static/journeyplanner/icons/walking.png width=25 height=25>");
          var road = ("<img src=static/journeyplanner/icons/road.png width=25 height=25>");

          // going through the object to get the travel mode details 

          if (travelMode == "WALKING") {

            distance = journeysteps[i].distance.text;
            duration = journeysteps[i].duration.text;
            instruction = journeysteps[i].instructions;

            //trimming the instruction text
            instruction = instruction.split(',');
            instruction = instruction[0];

            direction_text.append('<li>' + walking + '&nbsp;&nbsp;' + instruction + '</p><p>' + road + '&nbsp;&nbsp;<b>Duration:</b>&nbsp;' + duration + '</li>');

          }

          else if (travelMode == "TRANSIT") {
            var journey_steps = {}; //dictionary for each bus steps in the journey
            distance = journeysteps[i].distance.text;
            //duration=journeysteps[i].duration.text
            instruction = journeysteps[i].instructions;
            Route_number = journeysteps[i].transit.line.short_name;
            arrival_stop = journeysteps[i].transit.arrival_stop.name;
            departure_stop = journeysteps[i].transit.departure_stop.name;
            num_stops = journeysteps[i].transit.num_stops;
            arrival_latlng = journeysteps[i].transit.arrival_stop.location.lat() + ',' + journeysteps[i].transit.arrival_stop.location.lng();
            departure_latlng = journeysteps[i].transit.departure_stop.location.lat() + ',' + journeysteps[i].transit.departure_stop.location.lng();

            //trimming the instruction text
            instruction = instruction.split(',');
            instruction = instruction[0];



            journey_steps["route_number"] = Route_number;
            journey_steps["arrival_stop"] = arrival_stop;
            journey_steps["departure_stop"] = departure_stop;
            journey_steps["num_stops"] = num_stops;
            journey_steps["departure_latlng"] = departure_latlng;
            journey_steps["arrival_latlng"] = arrival_latlng;

            //turning the data to sent into json
            data = JSON.stringify(journey_steps);



            // sending a post request to the server
            $.ajax({
              type: "POST",
              url: "planner/",
              data: {
                data,
                date: date1,
                time: timeSeconds,
              }
            })
              .done(function (response) {
                prediction = response
                console.log(prediction)
                alert("successfully posted")

                console.log(prediction)

              })


            direction_text.append('<li>' + bus + '&nbsp;&nbsp;' + instruction + '</p><p>' + road + '&nbsp;&nbsp;<b>Route:&nbsp;</b>' + Route_number + '&nbsp;&nbsp;<b>Stops:&nbsp;</b>' + num_stops + '&nbsp;stops&nbsp;&nbsp;<b>Duration:</b>' + prediction + '</li>');


          };
        };
        ;

        //showing the response on the map. 	 
        directionsRenderer.setDirections(response);

        // google.maps.event.addListener(directionsRenderer, 'directions_changed', function() {
        //   console.log("changed")
        //   map.panBy(-600, 0);
        //   map.setZoom(map.getZoom() - 1);
        // });
        showSteps(response, markerArray, stepDisplay, map);
      }
      else {
        window.alert('Directions request failed due to ' + status);
      }
    });
}


function showSteps(directionResult, markerArray, stepDisplay, map) {
  // For each step, place a marker, and add the text to the marker's infowindow.
  // Also attach the marker to an array so we can keep track of it and remove it
  // when calculating new routes.
  var myRoute = directionResult.routes[0].legs[0];
  for (var i = 0; i < myRoute.steps.length; i++) {
    var marker = markerArray[i] = markerArray[i] || new google.maps.Marker;
    marker.setMap(map);
    marker.setPosition(myRoute.steps[i].start_location);
    attachInstructionText(
      stepDisplay, marker, myRoute.steps[i].instructions, map);
    allMarkers.push(marker);
  }
}


function attachInstructionText(stepDisplay, marker, text, map) {
  google.maps.event.addListener(marker, 'click', function () {
    // Open an info window when the marker is clicked on, containing the text
    // of the step.
    stepDisplay.setContent(text);
    stepDisplay.open(map, marker);
  });
}


// when the user click the go button, the route function runs and the results div shows
$(function () {

  $('#go').on('click', function () {

    removeLineFromMap();


    var time, date, datetimeValue;
    // use different variables for date and time depending on screen size
    if ($(window).width() < 992) {
      datetimeValue = $("#datetime-tab1").val();
      var arr = datetimeValue.split('T');
      date = arr[0];
      console.log("mobile date: " + date);
      time = arr[1];
    } else {
      var date = $("#datepicker-tab1").val();
      console.log("desktop date: " + date);
      time = $('#timepicker-tab1').val();
      console.log("desktop time: " + time);

      // use date and time here to make properly formatted datetimeValue for mobile
      datetimeValue = date + 'T' + time;
    }
    // show date and time inputs on desktop results page for better user experience
    // default date and time are those selected by user on input page
    $("#datepicker-tab1-results-date").flatpickr({
      altInput: true,
      altFormat: "F j, Y",
      dateFormat: 'yy-m-d',
      defaultDate: date,
      minDate: "today",
      onClose: function (selectedDates, dateStr, instance) {
        // sendDateTimeChangePostRequest();
        console.log("on close date tab1");
      },
    });

    $('#datepicker-tab1-results-time').flatpickr({
      enableTime: true,
      defaultDate: time,
      dateFormat: 'H:i',
      noCalendar: true,
      time_24hr: true,
      minTime: "05:00",
      minuteIncrement: 1,
      onClose: function (selectedDates, dateStr, instance) {
        // sendDateTimeChangePostRequest();
        console.log("on close time tab1");
      },
    });


    $(".datetime").val(datetimeValue);

    // convert time to seconds since midnight
    console.log("time: " + time);
    var timeSplit = time.split(':');
    var timeSeconds = (+timeSplit[0]) * 60 * 60 + (+timeSplit[1]) * 60;
    console.log(timeSeconds);

    // show results and routes
    routes();
    $(".form-area").hide();
    if ($(window).width() < 992) {
      $("#map-interface").animate({ top: "400px" }, 400);
    }
    $("#route-results").show();


  });

  // add on click to edit-journey button to hide results and show journey planner
  $('.edit-journey').on('click', function () {
    $(".form-area").show();
    if ($(window).width() < 992) {
      $("#map-interface").css("top", "0px");
    }
    $("#route-results").hide();
  });
});



