$(function () {
    // Vid ett musklick på knappen "login"
    $('#btn_login').on('click', function () {
        // Hämtar värden från inputs för att logga in
        var username = $('#username').val();
        var password = $('#password').val();
        // AJAX-anrop via route.php för att logga in
        $.ajax({
            type: 'POST',
            url: './php/route.php',
            data: {'controller': 'Controller', 'function': 'login', 'username': username, 'password': password},
            dataType: 'json',
            success: function (data) {
                // Om returvärdet är "success" skapas en cookie (loggedIn) och sätts till true
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
    // Om ett musklick sker på knappen "Uppdatera CSV" sparas data från databasen ner till backup.csv
    $('#btn_csv').click(function() {
        // Skickar ett 'POST' genom ett AJAX-anrop för att köra funktionen "updateCSVFromDB" i controllern
       $.ajax({
           type: 'POST',
           url: './php/route.php',
           data: {'controller' :'Controller', 'function': 'updateCSVFromDB'},
           dataType: 'json',
           success: function(data) {
           },
           error: function(data) {
               console.log(JSON.stringify(data));
           }
       })
    });

    // Klick på knappen "Lägg till marker"
    $('#btn_add').click(function(){
        // Kontrollera ifall input är tomt
       var lat = $('#lat').val(), lng = $('#lng').val(), info = $('#info').val();
       if(lat === "" || lng === "" || info === "")
       {
           alert("Fältet får inte vara tomt");
           return;
       }
        // Lägger ihop lng och lat med ett kommatecken som separeras i modellen vid uthämtning
        var coords = lng + "," + lat;

        // AJAX-anrop för att lägga till markör.
        // Skickar med variabeln coords och information om platsen som använderen skrev ner
        $.ajax({
            type: 'POST',
            url: './php/route.php',
            data: {'controller': 'Controller', 'function': 'addMarker', 'coords': coords, 'info': info},
            dataType: 'json',
            success:function(e){
                // Om funktionen lyckades laddas markörerna om på kartan för att få med den nya tillagda markören
                loadDataFromDB();
            },
            error:function(e){
                console.log(JSON.stringify(e));
            }
        });
    });

    // Klick på Uppdatera Markör
    // Uppdaterar på id så det läggs till i en dold input på admin-sidan
    $('#btn_update').click(function(){
        // Hämtar markörens id
        var id = $('#id').val();
        // Kontrollerar om fälten är tomma
        var lat = $('#lat').val(), lng = $('#lng').val(), info = $('#info').val();
        if(lat === "" || lng === "" || info === "")
        {
            alert("Fältet får inte vara tomt");
            return;
        }
        // Gör samma sak som "lägg till" men att vi skickar med id på markören för att uppdatera på
        var coords = lng + "," + lat;
        $.ajax({
            type: 'POST',
            url: './php/route.php',
            data: {'controller': 'Controller', 'function' : 'updateMarker', 'id' : id, 'coords' : coords, 'info' : info},
            dataType: 'json',
            success: function(data) {
                console.log(data);
                // Tar bort den marker som blev uppdaterad
                getMarkerById(id).setMap(null);
                // Laddar om alla markers från databasen (med den uppdaterade markerns nya position)
                loadDataFromDB();
            },
            error: function(data) {
                console.log('Error: '+ JSON.stringify(data));
            }
        })

    });

    // vid klick på "Ta bort"
    $('#btn_remove').click(function(){
        // Hämtar id på markören
        var id = $('#id').val();
        // AJAX-anrop till funktionen i controllern med värdet för id som skickas med
        $.ajax({
            type: 'POST',
            url: './php/route.php',
            data: {'controller': 'Controller', 'function' :'removeMarker', 'id' : id},
            dataType: 'json',
            success: function(data) {
                // Stänger inforutan om den var öppen för markören som togs bort
                if (infowindow)
                    infowindow.close();
                // Tar bort markören från kartan
                getMarkerById(id).setMap(null);
                // Tar bort markören från arrayen med alla markörer
                removeMarkerById(id);
            },
            error: function(data) {
                console.log('Error: '+ JSON.stringify(data));
            }
        })
    });

    // vid Klick på "Uppdatera databas"
    $('#btn_db').click(function(){
        // AJAX-anrop till funktionen i controllern som uppdaterar databasen från CSV-filen
        $.ajax({
            type: 'POST',
            url: './php/route.php',
            data: {'controller': 'Controller', 'function' :'updateDBFromCSV'},
            dataType: 'json',
            success: function(data) {
                // Stänger infoWindows som är öppna och laddar om markörer från databasen
                if (infowindow)
                    infowindow.close();
                loadDataFromDB();
            },
            error: function(data) {
                console.log('Error: '+ JSON.stringify(data));
            }
        })
    });

    // Funktion för att läsa av cookies
    function getCookie(name) {
        var value = "; " + document.cookie;
        var parts = value.split("; " + name + "=");
        if (parts.length == 2) return parts.pop().split(";").shift();
    }

    // Funktion för att kolla av om användaren är inloggad
    function isLoggedin(){
        return getCookie("loggedin");
    }
    // Om "isLoggedin" === true, visas containern för admin
    if (isLoggedin()) {
        $('#login-container').hide();
        $('#admin-container').show();
    }
    else  // annars visas containern för login
        {
        $('#login-container').show();
        $('#admin-container').hide();
    }
});

// Globala variabler för kartan
var map;
var infowindow;
var mymarkers = [];

//Callback funktion från Google Maps API:et.
//Funktionen skapar upp kartan och aktiverar SearchBox-plugin:et från Google Maps API.
//När allt från Google Maps API är klart så hämtas informationen som finns lagrad i databasen genom loadDatafromDB().
function initMap() {
    // skapar kartan
    var uluru = {lat: 60.1389958, lng: 15.1629542};
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: uluru,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR
        }
    });
    //Hämtar sökrutan och sparar den i input-variabeln.
    var input = document.getElementById('pac-input');
    //Skapar en sökruta enligt Google Maps API.
    var searchBox = new google.maps.places.SearchBox(input);
    map.addListener('bounds_changed', function () {
        searchBox.setBounds(map.getBounds());
    });
    var markers = [];
    searchBox.addListener('places_changed', function () {
        var places = searchBox.getPlaces();
        if (places.length == 0) {
            return;
        }
        // Tar bort gamla markörer.
        markers.forEach(function (marker) {
            marker.setMap(null);
        });
        markers = [];
        // för varje ställe hämtas ikonen, namnet och positionen.
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
            // Skapar en marker för varje ny plats
            markers.push(new google.maps.Marker({
                map: map,
                icon: icon,
                title: place.name,
                position: place.geometry.location
            }));
            // hämtar lat och lng för stället som klickas på
            $('#lat').val(place.geometry.location.lat);
            $('#lng').val(place.geometry.location.lng);
            if (place.geometry.viewport) {
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });
        map.fitBounds(bounds);
    });

    //Event-hanterare för de träffar som genererades från Sökrutan.
    var bounds = new google.maps.LatLngBounds();
    google.maps.event.addListener(map.data, 'addfeature', function (e) {
        if (e.feature.getGeometry().getType() === 'Point') {
            bounds.extend(e.feature.getGeometry().get());
            map.fitBounds(bounds);
        }
    });
    google.maps.event.addListener(map.data, 'click', function (e) {

    });

    //Klick på kartan lägger koordinaterna i inputsen.
    map.addListener('click', function(event) {
        var lat = event.latLng.lat();
        var lng = event.latLng.lng();
        $('#lat').val(lat);
        $('#lng').val(lng);
    });
    loadDataFromDB();
}
// Hjälpfunktion som öppnar och stänger infoWindow.
// Funktionen tar en Feature, d.v.s markören där inforutan ska öppnas och även den data som ska visas i rutan.
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
//Funktion för att hämta all data från databasen.
function loadDataFromDB() {
    clearAllMarkers();

    $.ajax({
        type: "POST",
        url: "./php/route.php",
        data: {"controller": "Controller", "function": "getMarkers"},
        dataType: "json",
        success: function (data) {
            //Skapa alla markers och säg att markören ska innehålla väderdata.
            setMarkers(data);
        },
        error: function (data) {
            console.log(JSON.stringify(data));
        }
    });
}

// Funktion för att skapa markörer och lägga till dem i en array över alla markers.
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

        //Skapar kopplar en feature till markören.
        var feature = new google.maps.Data.Feature();
        feature.setGeometry(c);
        feature.setProperty("information", marker.content);
        feature.setProperty("id", f.properties.feature_id);

        // Skapar ett klick-event till markörerna för att öppna rätt infoWindow.
        marker.addListener('click', function(e){
            var id = this.id;
            $('#id').val(id);
            $('#lat').val(this.position.lat);
            $('#lng').val(this.position.lng);
            $('#info').val(this.content);

            var content = "<span>Information:" + this.feature.getProperty('information') + "</span>";
            openInfoWindow(this.feature, content);
        });
        marker.feature = feature;
        mymarkers.push(marker);
    }
}

// Hjälpfunktion som tar bort alla markers från kartan.
function clearAllMarkers(){
    if (infowindow)
        infowindow.close();
    // loopar igenom arrayen och tar bort varje marker på id.
    for (var i = 0; i < mymarkers.length; i++) {
        if (mymarkers[i].id === id) {
            mymarkers[i].setMap(null);
        }
    }
    mymarkers = [];
}

// Hjälpfunktion som tar bort marker baserat på id.
function removeMarkerById(id){
    var tempMarkers = mymarkers;
    for (var i = 0; i < tempMarkers.length; i++) {
        if (tempMarkers[i].id === id) {
            delete mymarkers[i];
            break;
        }
    }
}
// Hjälpfunktion som hämtar markers på ID.
// Funktionen används vid sammankoppling av nyheter och markörer.
function getMarkerById(id) {
    for (var i = 0; i < mymarkers.length; i++) {
        if (mymarkers[i].id === id) {
            return mymarkers[i];
        }
    }
}