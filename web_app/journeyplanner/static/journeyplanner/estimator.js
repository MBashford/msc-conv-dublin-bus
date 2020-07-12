var routes = "";
var route_number = "";
var stop_name = "";
var stations = "";
var routes = ""


$(function() {

var jqxhr = $.getJSON("static/journeyplanner/ordered_stops_main.json", null, function (data) {
    stations = data;

    for (var key in stations) {
        route_number += key + " ";
    }

    //turning the into an array
    route_number = route_number.trim().split(" ");
});

$( "#estimator-route" ).autocomplete({
  source: function( request, response ) {
          var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( request.term ), "i" );
          response( $.grep( route_number, function( item ){
              return matcher.test( item );
          }) );
      }
});

  });

  
// function to populate the sub_routes list			
function route_list() {

     sel= $("#estimator-route").val();
     console.log(sel)

    //getting the value of the selected route
    var list = ''

    //jquery to open the json file 
    $.getJSON("static/journeyplanner/ordered_stops_main.json", null, function (data) {
        stations = data;

        // populating the sub route select list 
        var To = "<option value=0>Sub Route</option>";
        for (var key in stations) {


            if (sel.toString() == key.toString()) {
              
                routes = stations[key]

                for (var key2 in routes) {
                    console.log(key2)
                    list += key2 + " ";
                }
            }
        }

        //turning the into an array
        list = list.trim().split(" ");
        result=list

        //popuplating the sub route select list
        for (var i = 0; i < list.length; i++) {
            To += "<option  value=" + list[i] + ">" + list[i] + "</option>";
        }

        document.getElementById("estimator-sub").innerHTML = To;

    });
}

//getting the value of the selected sub route
var sel_sub = "";
var direction= ""
var stop_list=[];

// function to populate the origin and destination
function stops() {
    var To = "<option value=0>Stops</option>";

    // getting the value of the selected sub-route
    sel_sub = $("#estimator-sub").val();

    // going through the sub-routes the selected route has 
    for (key in routes) {
   
        // if the user selected sub-route is found 
        if (sel_sub == key) {
 
            // the stops the selected sub-routes goes through
            bus_stops = routes[key].stops;

            direction= routes[key].direction


            // poppulating the origin and destination with the stops
            for (var i = 0; i < bus_stops.length; i++) {
                To += "<option  value=" + bus_stops[i] + ">" + bus_stops[i] + "</option>";

                stop_list.push(bus_stops[i])

            }

            // populating the inner html
          $("#estimator-origin").html(To) 

        }
    }  
}
var index;
    // function to populate the remaining destination stop
    function destination(){
        var To = "<option value=0>Stops</option>";

        starting_stop=$("#estimator-origin").val()
        console.log(starting_stop)
        console.log(stop_list) 
        index = stop_list.indexOf(+starting_stop) //finding the index of the selected stop
        destination_list=stop_list.slice(index + 1) //displaying the stops after the selected stops 

        console.log(destination_list)

        for (var i = 0; i < destination_list.length; i++) {
            To += "<option  value=" + destination_list[i] + ">" + destination_list[i] + "</option>";

        }

           // populating the inner html with the destination
           $("#estimator-destination").html(To)
        



    }


function origin_marker(){
    var origin_stop=$("#estimator-origin").val()
    var route=sel= $("#estimator-route").val();
    
    
    $.ajax({
        type:"POST",
        url:"list_latlng/",
        data:{route:route}
      })

      .done(function(response){
          console.log("successfully posted");
          var x=JSON.parse(response)

          var map = new google.maps.Map(document.getElementById("map"), {
            zoom: 14,
            center:{ lat: 53.350140, lng: -6.266155 }
          })

          for (key in x) { 
           var marker = new google.maps.Marker({
              position: new google.maps.LatLng(x[key].lat, x[key].lng),
              map: map,
              title: "Stop" + key,
              

             
            });
            }
      });
}


// event listner to porpulate the route dropdown list)
$("#estimator-route").on('keyup click change hover',route_list);

// event listner to populate the origin and destination 
$("#estimator-sub").change(stops);

$("#estimator-route").change(origin_marker);
$("#estimator-origin").change(destination);


// go button for tab 2 to show and hide results
$(function () {
  
    $('#stop-to-stop-go').on('click', function () {
        var datetimeValue = $("#datetime-tab2").val();
        var arr = datetimeValue.split('T');
        var date = arr[0];
        var input_time = arr[1];

         // convert time to seconds since midnight
        // console.log("time: "+ input_time);
        var timeSplit = input_time.split(':');
        var timeSeconds = (+timeSplit[0]) * 60 * 60 + (+timeSplit[1]) * 60;
        //console.log(timeSeconds);
     
      // sending a post request to the server
      $("#stop-to-stop-estimate").html("Loading result..");
      $.ajax({
          type:"POST",
          url: "prediction/",
          data:{date:date,
                time:timeSeconds,
                route:$("#estimator-route").val(),
                origin:$("#estimator-origin").val(),
                destination:$("#estimator-destination").val(),
                direction:direction
            }
        })

        .done(function(result){
            console.log("successfully posted");
            $("#stop-to-stop-estimate").html(result + " minutes");
            // console.log(result);

        });




    // show results
        $(".form-area").hide();
        if ($(window).width() < 992) {
            $("#map-interface").css("top", "300px");
        }
        $("#stop-to-stop-results").show();

        //getting the value of the user selected time
        var time= $("#datetime-tab2").val();
        

        var dateArr, date, dateElements, year, month, date, time, dateToDisplay;

        dateArr = time.split('T');
        date = dateArr[0];
        dateElements = date.split('-');
        year = dateElements[0];
        month = dateElements[1];
        date = dateElements[2];
        dateToDisplay = date + "-" + month + "-" + year;

        time = dateArr[1];

        // set the value of the html for the results using the html id
        $("#origin-tab2").html("Stop " + $("#estimator-origin").val());
        $("#destination-tab2").html("Stop " + $("#estimator-destination").val());
        $("#datetime-tab").html(dateToDisplay + ", " + time)
  
  
  
  
    });
  
    // add on click to edit-journey button to hide results and show journey planner
    $('#edit-journey-tab2').on('click', function () {
        console.log("inside edit-journey-results");
      $(".form-area").show();
      $("#map-interface").css("top", "0px");
      $("#stop-to-stop-results").hide();
    });
  
  
  });