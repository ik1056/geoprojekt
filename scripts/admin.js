$(function () {
    $('#btn_login').on('click', function () {
        var username = $('#username').val();
        var password = $('#password').val();
        $.ajax({
            type: 'POST',
            url: './php/route.php',
            data: {'controller': 'Controller', 'function': 'login', 'username': username, 'password': password},
            dataType: 'json',
            success: function (data) {
                if (data === "success") {
                    var d = new Date();
                    var hours = 24;
                    d.setTime(d.getTime() + (hours * 60 * 60 * 1000));
                    document.cookie = "loggedin=true; expires=" + d.toUTCString() + ";";
                    location.reload();
                }
            },
            error: function (data) {
                console.log('Error: ' + JSON.stringify(data));
            }
        })
    });

    $('#btn_add').click(function(){

    });

    $('#btn_update').click(function(){

    });

    $('#btn_remove').click(function(){

    });

    function getCookie(name) {
        var value = "; " + document.cookie;
        var parts = value.split("; " + name + "=");
        if (parts.length == 2) return parts.pop().split(";").shift();
    }

    function isLoggedin(){
        return getCookie("loggedin");
    }
    if (isLoggedin()) {
        $('#login-container').hide();
        $('#admin-container').show();
    }
    else {
        $('#login-container').show();
        $('#admin-container').hide();
    }
});
var map;
var infowindow;
var mymarkers = [];

function initMap() {
    var uluru = {lat: 60.1389958, lng: 15.1629542};
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: uluru,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR
        }
    });
    // Create the search box and link it to the UI element.
    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function () {
        searchBox.setBounds(map.getBounds());
    });
    var markers = [];
    searchBox.addListener('places_changed', function () {
        var places = searchBox.getPlaces();
        if (places.length == 0) {
            return;
        }
        // Clear out the old markers.
        markers.forEach(function (marker) {
            marker.setMap(null);
        });
        markers = [];
        // For each place, get the icon, name and location.
        var bounds = new google.maps.LatLngBounds();
        places.forEach(function (place) {
            if (!place.geometry) {
                console.log("Returned place contains no geometry");
                return;
            }
            var icon = {
                url: place.icon,
                size: new google.maps.Size(71, 71),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(17, 34),
                scaledSize: new google.maps.Size(25, 25)
            };
            // Create a marker for each place.
            markers.push(new google.maps.Marker({
                map: map,
                icon: icon,
                title: place.name,
                position: place.geometry.location
            }));
            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });
        map.fitBounds(bounds);
    });


    var bounds = new google.maps.LatLngBounds();
    google.maps.event.addListener(map.data, 'addfeature', function (e) {
        if (e.feature.getGeometry().getType() === 'Point') {
            bounds.extend(e.feature.getGeometry().get());
            map.fitBounds(bounds);
        }
    });
    google.maps.event.addListener(map.data, 'click', function (e) {
        var id = e.feature.getProperty('id');
        var marker = getMarkerById(id);

        $('#id').val(id);
        $('#lat').val(marker.position.lat);
        $('#lng').val(marker.position.lng);
        $('#info').val(marker.content);

        var content = "<span>Information:" + e.feature.getProperty('information') + "</span>";
        openInfoWindow(e.feature, content);
    });

    loadDataFromDB();
}

function openInfoWindow(feature, data) {
    if (infowindow) {
        infowindow.close();
    }

    infowindow = new google.maps.InfoWindow({
        content: data,
        options: {pixelOffset: new google.maps.Size(0, -30)},
        position: feature.getGeometry().get()
    });
    infowindow.open(map);
}

function loadDataFromDB() {
    $.ajax({
        type: "POST",
        url: "./php/route.php",
        data: {"controller": "Controller", "function": "getMarkers"},
        dataType: "json",
        success: function (data) {
            setMarkers(data);
        },
        error: function (data) {
            console.log(JSON.stringify(data));
        }
    });
}

//Skapa en feature och lägg till den i en array över alla markers.
function setMarkers(data) {
    for (var i = 0; i < data.features.length; i++) {
        var f = data.features[i];
        var g = data.features[i].geometry;
        var c = {lat: g.coordinates[1], lng: g.coordinates[0]};

        var marker = new google.maps.Marker({
            position: c,
            map: map,
            content: f.properties.information,
            title: "" + mymarkers.length,
            id: f.properties.feature_id,
            feature: undefined
        });

        var feature = new google.maps.Data.Feature();
        feature.setGeometry(c);
        feature.setProperty("information", marker.content);
        feature.setProperty("id", f.properties.feature_id);

        marker.feature = feature;
        mymarkers.push(marker);
        map.data.add(feature);
    }
}
function getMarkerById(id) {
    for (var i = 0; i < mymarkers.length; i++) {
        if (mymarkers[i].id === id) {
            return mymarkers[i];
        }
    }
}