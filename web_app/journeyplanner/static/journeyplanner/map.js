// code for map from https://developers.google.com/maps/documentation/javascript/tutorial
var map;
function initMap() {
    console.log("hello");
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 53.350140, lng: -6.266155 },
        zoom: 13
    });
}

// show map when map button clicked
// .ready waits for DOM to be loaded before executing this function
$(document).ready(function () {

    $("#show-map").click(function () {

        // Toggle display of map-interface 
        $("#map-interface").toggle();

        // Change text on show/hide map button
        if ($("#map-interface").is(":hidden")){
            $("#show-map").html("Hide Map");
        } else {
            $("#show-map").html("Show Map");
        }
    });

    // Show interface if hidden when window resized
    $(window).resize(function () {
        if ($(window).width() >= 992) {
            $("#map-interface").show();
        }
    });

});


