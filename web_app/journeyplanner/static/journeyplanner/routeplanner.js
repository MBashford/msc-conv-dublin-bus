//using google map autocomplete for the address          
var input1 = document.getElementById('origin');
var input2 = document.getElementById("destination");
var options = { componentRestrictions: { country: "ie" }, types: ['geocode'] };
origin = new google.maps.places.Autocomplete(input1, options);
destination = new google.maps.places.Autocomplete(input2, options);



	

// function to create a marker for the bus station nearby from the user location 
function createMarker(place) {
  var marker = new google.maps.Marker({
            map: map,
            icon:"http://maps.google.com/mapfiles/ms/micons/bus.png",
            position: place.geometry.location
          });
  
  google.maps.event.addListener(marker, 'click', function() {
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
  
  // The routes function that shows the route 
  function routes() {
    var markerArray = [];
              
    //getting the lat and lng of the input address 
    var starting = origin.getPlace();
    var ending= destination.getPlace();
      
    //starting address latitude
    starting_lat = starting.geometry.location.lat();
    starting_lng= starting.geometry.location.lng();
      
    //destination address longitude   
     ending_lat=ending.geometry.location.lat();
     ending_lng=ending.geometry.location.lng();
      
       
    // Create a map and center it on Manhattan.
    var map = new google.maps.Map(document.getElementById('map'), {
    //          zoom: 14,
              center: {lat: starting_lat, lng: starting_lng}
            });
      
    // Create a renderer for directions and bind it to the map.
    var directionsRenderer = new google.maps.DirectionsRenderer({map: map});
    
    // Instantiate an info window to hold step text.
    var stepDisplay = new google.maps.InfoWindow;
    
    // Display the route between the initial start and end selections.
     calculateAndDisplayRoute( directionsRenderer, directionsService, markerArray, stepDisplay, map);}
        
        
        
        
    // calculating and showing the bus routes
    function calculateAndDisplayRoute(directionsRenderer, directionsService, markerArray, stepDisplay, map) {
      
    // First, remove any existing markers from the map.
    for (var i = 0; i < markerArray.length; i++) {
              markerArray[i].setMap(null);}
    
    // Retrieve the start and end locations and create a DirectionsRequest using
      
     // Bus directions.
     directionsService.route({
    origin: document.getElementById('origin').value,
    destination: document.getElementById('destination').value,
              travelMode: 'TRANSIT',
              transitOptions: {
            modes: ['BUS'],
          routingPreference: 'FEWER_TRANSFERS',
      } },
                 
    // showing the response received in a text format 
      function(response, status) {
        // Route the directions and pass the response to a function to create
       
       console.log(response)
        // markers for each step.
         if (status === 'OK') {
    
    
    staringAddress=response.routes[0].legs[0].start_address;
         
    endingAddress=response.routes[0].legs[0].end_address;
    
        
    journeysteps=response.routes[0].legs[0].steps;
         
    console.log(journeysteps)
         
    //Then if no tbody just select your table 
    var left = $('#left');
    var right=$("#text");
         
    for (var i = 0; i < journeysteps.length; i++) {
    // the route distance
    var distance='';  
    
    // the route instruction example (walk , take bus)
    var instruction='';
      
    // the departing stop
    var departure_stop='';
      
    // the arival stop	
    var arrival_stop='';
      
    // the number of stops between arrival and departing stop
    var num_stops='';
      
    // the walking duration , we will predict the bus one 
    var duration='';
      
    // the bus number user take
    var Route_number='';
    
    // going through the repsone recieved from google
    var travelMode =journeysteps[i].travel_mode;
 
    //picture
    var bus=("<img src=static/journeyplanner/icons/com.nextbus.dublin.jpg width=50 height=50>");
    var walking=("<img src=static/journeyplanner/icons/walking.png width=50 height=50>");
    var road=("<img src=static/journeyplanner/icons/road.png width=50 height=50>");
      
    // going through the object to get the travel mode details 
      
    if (travelMode=="WALKING") {
      
    distance=journeysteps[i].distance.text;
    duration=journeysteps[i].duration.text;
    instruction=journeysteps[i].instructions;
      
    right.append('<p>'+walking+'&nbsp;&nbsp;'+instruction+'</p><p>'+road+'&nbsp;&nbsp;<b>Duration:</b>&nbsp;'+duration+'</p>');
      
    }
      
    else if (travelMode == "TRANSIT") {
    distance=journeysteps[i].distance.text;
    //duration=journeysteps[i].duration.text
    instruction=journeysteps[i].instructions;
    Route_number=journeysteps[i].transit.line.short_name;
    arrival_stop=journeysteps[i].transit.arrival_stop.name;
    departure_stop=journeysteps[i].transit.departure_stop.name;
    num_stops=journeysteps[i].transit.num_stops;

    right.append('<p>'+bus+'&nbsp;&nbsp;'+instruction+'</p><p>'+road+'&nbsp;&nbsp;<b>Route:&nbsp;</b>'+Route_number+'&nbsp;&nbsp;<b>Stops:&nbsp;</b>'+num_stops+'&nbsp;stops&nbsp;&nbsp;<b>Duration:</b>'+duration+'</p>');

    };
    };
     
      //showing the response on the map. 	 
         directionsRenderer.setDirections(response);
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
                  stepDisplay, marker, myRoute.steps[i].instructions, map);}}
       
    
     function attachInstructionText(stepDisplay, marker, text, map) {
       google.maps.event.addListener(marker, 'click', function() {
    // Open an info window when the marker is clicked on, containing the text
    // of the step.
        stepDisplay.setContent(text);
        stepDisplay.open(map, marker);
            });
          }	  
            
  // when the user click the go button, the route function runs and the results div shows
  $(function(){
    $('#go').on('click', function(){
       routes();
       $(".form-area").hide();
       $("#route-results").show();
    });

    // add on click to edit-journey button to hide results and show journey planner
    $('#edit-journey').on('click', function(){
      $(".form-area").show();
      $("#route-results").hide();
   });

    
  });
  
  

