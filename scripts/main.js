var map;
var infowindow;
var infoWindow;
var mymarkers = [];
var showNews = false;

//Callback funktion från Google Maps API:et.
//Funktionen skapar upp kartan och aktiverar SearchBox-plugin:et från Google Maps API.
//När allt från Google Maps API är klart så hämtas informationen som finns lagrad i databasen genom loadDatafromDB().
function initMap() {
    //Bygger upp kartan.
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
            var marker = new google.maps.Marker({
                map: map,
                icon: icon,
                title: place.name,
                position: place.geometry.location
            });
            markers.push(marker);

            var service = new google.maps.places.PlacesService(map);

            service.getDetails({
                placeId: place.place_id
            }, function(place, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    var mark = markers[markers.length - 1];

                    google.maps.event.addListener(mark, 'click', function () {
                        if (infoWindow) {
                            infoWindow.close();
                        }
                        infoWindow = new google.maps.InfoWindow();

                        var opts = google.maps.places.PhotoOptions;
                        opts = {
                            maxHeight: 160,
                            maxWidth: 90
                        };
                        var content = "<h4>" + place.name + "<small> " + place.rating + "</small></h4>";
                        if (place.opening_hours)
                            content += "<span class='badge badge-success'>Öppet</span><br><p>" + place.formatted_address + "</p>";
                        else
                            content += "<span class='badge badge-danger'>Stängt</span><br><p>" + place.formatted_address + "</p>";
                        if (place.photos && place.photos.length > 0) {
                            var photo = place.photos[0].getUrl(opts);
                            content += "<img src=" + photo + " class='rounded' style='margin-bottom: 15px;'>";
                        }
                        if (place.reviews && place.reviews.length > 0) {
                            content += "<div class='col-12' style='overflow-x: hidden; max-height: 200px; overflow-y: scroll;'>";
                            for (var j = 0; j < place.reviews.length; ++j) {
                                var name = place.reviews[j].author_name;
                                var rating = place.reviews[j].rating;
                                var text = place.reviews[j].text;
                                var profilepic = place.reviews[j].profile_photo_url;
                                var url = place.reviews[j].author_url;
                                console.log(profilepic);

                                content += "<div class=''>";
                                content += "<div class='col-2'>";
                                content += "<img src='" + profilepic + "' style=' height:35px;'/>";
                                content += "</div>";
                                content += "<div class='col-10'>";
                                content += "<h6><a href='" + url + "' target='_blank'>" + name + "</a></h6>";
                                content += "<span>";
                                for (var i = 0; i < 5; i++) {
                                    if (i < rating)
                                        content += "<i class='fas fa-star'></i>";
                                    else
                                        content += "<i class='far fa-star'></i>"
                                }
                                content += "</span>";
                                content += "<p>" + text + "</p>";
                                content += "</div>" +
                                    "</div>";
                            }
                            content += "</div>";
                        }
                        infoWindow.setContent(content);
                        infoWindow.setPosition(mark.position);
                        infoWindow.setOptions({pixelOffset: new google.maps.Size(-2, -25)});
                        infoWindow.open(map);
                        console.log(place);
                    });
                }
            });
            if (place.geometry.viewport) {
                // Only geocodes have viewport.
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
        //Kollar om feature ska hämta värderinformation.
        if (e.feature.getProperty('weather') !== undefined && e.feature.getProperty('weather') === "") {
            getWeatherData(e.feature);
        } //Om feature redan har hämtat värderinformation
        else if (e.feature.getProperty('weather') !== "" && e.feature.getProperty('weather') !== undefined) {
            var data = e.feature.getProperty('weather');
            var content = "<span>Information:" + e.feature.getProperty('information') + "</span><br>" +
                "<span>Väder:</span><img src=" + data.weather.icon + " style='width: 25px; height: 25px;'/>" +
                "<span>" + data.temperature.temp + "</span>";
            openInfoWindow(e.feature, content);
        }//Annars om feature inte ska ha väderinformation - visa bara information
        else {
            var content = "<span>Information:" + e.feature.getProperty('information') + "</span>";

            openInfoWindow(e.feature, content);
        }
    });

    //Hämta data som finns i databasen.
    loadDataFromDB();
}

//Funktion för att hämta värderdata från databasen.
//Data hämtas genom ett Ajax-anrop mot Route-filen.
function getWeatherData(feature) {
    var lat = feature.getGeometry().get().lat();
    var lng = feature.getGeometry().get().lng();
    var info = feature.getProperty("information");

    $.ajax({
        type: "POST",
        url: "./php/route.php",
        data: {"controller": "Controller", "function": "getCurrentWeather", "lat": lat, "lng": lng},
        dataType: "json",
        success: function (data) {
            var content = "<span>Information:" + feature.getProperty('information') + "</span><br>" +
                "<span>Väder:</span><img src=" + data.weather.icon + " style='width: 25px; height: 25px;'/>" +
                "<span>" + data.temperature.temp + "</span>";
            feature.setProperty('weather', data);
            openInfoWindow(feature, content);
        }
    });
}

//Hjälpfunktion för att öppna en info-ruta och stänga den som redan är öppen.
//Funktionen tar en Feature, d.v.s markören där inforutan ska öppnas och även den data som ska visas i rutan.
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
    $.ajax({
        type: "POST",
        url: "./php/route.php",
        data: {"controller": "Controller", "function": "getMarkers"},
        dataType: "json",
        success: function (data) {
            //Skapa alla markers och säg att markören ska innehålla väderdata.
            setMarkers(data, true);
        },
        error: function (data) {
            console.log(JSON.stringify(data));
        }
    });
}

//Funktion för att skapa markörer och lägga till dem i en array över alla markers.
//Funktionen tar emot data, d.v.s det som ska visas när man klickar på en markör och även om markören innehåller värderinformation.
function setMarkers(data, hasWeather) {
    for (var i = 0; i < data.features.length; i++) {
        var f = data.features[i];
        var g = data.features[i].geometry;
        var c = {lat: g.coordinates[1], lng: g.coordinates[0]};
        var img = null;
        //Om det inte ska innehålla väder så sätter vi en annan ikon.
        //T.ex. en varning för trafikolyckor.
        if (!hasWeather)
            img = "./assets/warningSmall.png";
        //Bygger upp en ny markör.
        var marker = new google.maps.Marker({
            position: c,
            icon: img,
            map: map,
            content: f.properties.information,
            title: "" + mymarkers.length,
            id: "",
            feature: undefined,
            isNews: false
        });

        //Skapar en ny feature som vår markör kopplas till.
        var feature = new google.maps.Data.Feature();
        feature.setGeometry(marker.position);
        feature.setProperty("information", marker.content);
        feature.setProperty("id", mymarkers.length);
        //Om markören innehåller väder så är det inte för trafiknyheter, alltså är det bara en Feature och ingen Marker som visas på kartan.
        if (hasWeather) {
            feature.setProperty("weather", "");
            map.data.add(feature);
        }
        else {
            marker.isNews = true;
            marker.id = data.features[i].properties.newsId;
            marker.addListener('click', function () {
                var content = "<span>Information:" + marker.feature.getProperty('information') + "</span>";
                openInfoWindow(marker.feature, content);
            });
        }
        marker.feature = feature;
        mymarkers.push(marker);
    }
}

//Hjälpfunktion för att hämta ut en markör baserat på dess ID.
//Funktionen används vid sammankoppling av nyheter och markörer.
function getMarkerById(id) {
    for (var i = 0; i < mymarkers.length; i++) {
        if (mymarkers[i].id === id) {
            return mymarkers[i];
        }
    }
}

//Rensa alla markörer för nyheter.
function clearNewsMarkers(){
    var deleteMarkers = [];
    for(var i = 0; i < mymarkers.length; i++){
        if(mymarkers[i].isNews)
            deleteMarkers.push(mymarkers[i]);
    }

    mymarkers = mymarkers.filter( function( el ) {
        return !deleteMarkers.includes( el );
    } );

    for(i = 0; i < deleteMarkers.length; i++){
        deleteMarkers[i].setMap(null);
    }
}

$(document).ready(function () {
    //Visar värderinformation över Borlänge på hemsidan.
    showWeatherWidget(60.4866813, 15.4060031);

    $('#directions').on('click', function () {
        $('#directions-container').toggleClass('hidden');
    });
    $('#calc-route').click(function(){
        showDirections();
    });
    $('#traffic-info').click(function () {
        toggleTrafficMarkers();
    });
    //När man klickar på en nyhet i nyhetsflödet så kommer man att tas till platsen där nyheten gäller och sedan öppna dess inforuta.
    $('#news-rss').on('click', 'a[class=news-item]', function (e) {
        //ID:t över nyheten sparas i ett data-attribut.
        var id = e.currentTarget.dataset.newsId;
        if (id !== undefined) {
            var m = getMarkerById(id);
            if (m !== undefined) {
                openInfoWindow(m.feature, m.content);
                map.setZoom(7);
                map.panTo(m.position);
            }
        }
    });
});

//Funktion för att visa värdret över en specifik plats.
//Denna funktion är bara till för att ändra värderinformationen som är statisk på sidan och har därmed
//inget att göra med markörernas värderinformation.
function showWeatherWidget(lat, lng) {
    $.ajax({
        type: "POST",
        url: "./php/route.php",
        data: {"controller": "Controller", "function": "getCurrentWeather", "lat": lat, "lng": lng},
        dataType: "json",
        success: function (data) {
            console.log(data);

            $('#weather').append("<img src='" + data.weather.icon + "' style='width:40px;'><span>" + data.weather.desc + "</span> <span>" + data.temperature.temp + "&deg;C</span>");
        },
        error: function (data) {
            console.log(JSON.stringify(data));
        }
    });
}

//Funktion för att beräkna en rutt mellan 2 punkter.
//Dessa punkter hämtas genom 2st input-fält.
//Om alternativa rutter finns kommer dessa att visas som extrainformation i rutt-beskrivningen.
function showDirections() {
    $('#news-rss').empty();
    showNews = false;
    if (typeof directionsDisplay != 'undefined') {
        directionsDisplay.setMap(null);
    }
    directionsDisplay = new google.maps.DirectionsRenderer;
    directionsService = new google.maps.DirectionsService;
    //dropdown stuff

    var start = $('#fromDestination').val();
    var end = $('#toDestination').val();
    var travelChoice = $('#transitMode').val();
    directionsService.route({
        origin: start,
        destination: end,
        travelMode: travelChoice,
        provideRouteAlternatives: true
    }, function (response, status) {
        if (status === 'OK') {
            directionsDisplay.setDirections(response);
            directionsDisplay.setMap(map);
            directionsDisplay.setPanel(document.getElementById('news-rss'));
            console.log(response);
        } else {
            window.alert('Hittade ingen väg mellan ' + start + ' och ' + end);
        }
    });
}

function getStationsInZone(lat, lng) {
    $.ajax({
        type: 'POST',
        url: './php/route.php',
        data: {'controller': 'Controller', 'function': 'getStationsInZone', 'lat': lat, 'lng': lng},
        dataType: 'json',
        success: function (data) {
            console.log(data);
        },
        error: function (data) {
            console.log('Error: ' + JSON.stringify(data));
        }
    })
}

//Funktion för att hämta eller stänga trafikinformationen på sidan.
//Informationen hämtas från trafikverkets API genom att skicka iväg XML-data i POST via Ajax.
function toggleTrafficMarkers() {
    if(!showNews) {
        $.support.cors = true;
        var query =
            "<REQUEST>" +
            "<LOGIN authenticationkey='88597617d8524d5e9baf509b2b92a968' />" +
            "<QUERY objecttype='Situation' limit='10'>" +
            "<FILTER>" +
            "<OR>" +
            "<ELEMENTMATCH>" +
            "<EQ name='Deviation.ManagedCause' value='true'/>" +
            "<IN name='Deviation.MessageType' value='Trafikmeddelande,Olycka' />" +
            "</ELEMENTMATCH>" +
            "<ELEMENTMATCH>" +
            "<EQ name='Deviation.MessageType' value='Färjor' />" +
            "<EQ name='Deviation.IconId' value='ferryServiceNotOperating' />" +
            "</ELEMENTMATCH>" +
            "<ELEMENTMATCH>" +
            "<EQ name='Deviation.MessageType' value='Restriktion' />" +
            "<EQ name='Deviation.MessageCode' value='Väg avstängd' />" +
            "</ELEMENTMATCH>" +
            "<ELEMENTMATCH>" +
            "<EQ name='Deviation.MessageType' value='Vägarbete'/>" +
            "<EQ name='Deviation.SeverityCode' value='5'/>" +
            "</ELEMENTMATCH>" +
            "<ELEMENTMATCH>" +
            "<NE name='Deviation.MessageType' value='Vägarbete' />" +
            "<GTE name='Deviation.SeverityCode' value='4' />" +
            "</ELEMENTMATCH>" +
            "</OR>" +
            "</FILTER>" +
            "</QUERY>" +
            "</REQUEST>";

        //Bygger upp alla nyheter.
        $('#news-rss').empty();
        $.ajax({
            type: "POST",
            url: "http://api.trafikinfo.trafikverket.se/v1.3/data.json",
            contentType: "text/xml",
            dataType: "json",
            data: query,
            success: function (data) {
                console.log(data);
                var rs = data.RESPONSE.RESULT[0].Situation;
                for (var i = 0; i < rs.length; i++) {
                    var timePosted = rs[i].Deviation[0].CreationTime;
                    var start, end;
                    start = rs[i].Deviation[0].StartTime.split('T')[0];
                    try {
                        end = rs[i].Deviation[0].EndTime.split('T')[0];
                    } catch (e) {
                        end = undefined;
                    }

                    var county = rs[i].Deviation[0].CountyNo[0];
                    //Alla Län är sparade i en lista där ett nummer representerar ett Län.
                    //En komplett lista över alla Län finns på Trafikverkets API http://api.trafikinfo.trafikverket.se/API/Model - Situation - Deviation.CountyNo[].
                    switch (county) {
                        case 0:
                            county = "Hela Sverige";
                            break;
                        case 1:
                            county = "Stockholms Län";
                            break;
                        case 2:
                            county = "Stockholms Län";
                            break;
                        case 3:
                            county = "Uppsala län";
                            break;
                        case 4:
                            county = "Södermanlands län";
                            break;
                        case 5:
                            county = "Östergötlands län";
                            break;
                        case 6:
                            county = "Jönköpings län";
                            break;
                        case 7:
                            county = "Kronobergs län";
                            break;
                        case 8:
                            county = "Kalmar län";
                            break;
                        case 9:
                            county = "Gotlands län";
                            break;
                        case 10:
                            county = "Blekinge län";
                            break;
                        case 12:
                            county = "Skåne län";
                            break;
                        case 13:
                            county = "Hallands län";
                            break;
                        case 14:
                            county = "Västra Götalands län";
                            break;
                        case 17:
                            county = "Värmlands län";
                            break;
                        case 18:
                            county = "Örebro län";
                            break;
                        case 19:
                            county = "Västmanlands län";
                            break;
                        case 20:
                            county = "Dalarnas län";
                            break;
                        case 21:
                            county = "Gävleborgs län";
                            break;
                        case 22:
                            county = "Västerbottens län";
                            break;
                        case 23:
                            county = "Jämtlands län";
                            break;
                        case 24:
                            county = "Västerbottens län";
                            break;
                        case 25:
                            county = "Norrbottens län";
                            break;
                    }
                    var id = rs[i].Id;
                    var html = '<a href="#" class="news-item" data-news-id="' + id + '"><div class="traffic-news-item">';
                    html += '<div class="traffic-rss-header">';
                    html += '<span class="traffic-rss-headline">';
                    html += county;
                    html += '</span>';
                    html += '<span class="traffic-news-posted">';
                    if (end !== undefined)
                        html += start + " - " + end;
                    else
                        html += start;
                    html += '</span>';
                    html += '</div>';
                    if (rs[i].Deviation[0].RoadNumber !== undefined)
                        html += '<span>' + rs[i].Deviation[0].RoadNumber + '</span>';
                    html += '<div class="traffic-rss-footer">';
                    html += '       </div>';
                    html += '</div></a>';
                    $('#news-rss').append(html);

                    //Positionen där nyheten gäller kommer i form av en WKT-punkt se https://en.wikipedia.org/wiki/Well-known_text för mer information.
                    //Eftersom punkten då behöver göras om till en Feature så används JQuery-plugin:et JQuery Geo.
                    //Plugin:et gör alltså om WKT-punkten till GeoJSON-data som sedan används för att bygga upp vår struktur för Google Maps GeoJSON.
                    if (rs[i].Deviation[0].Geometry.WGS84 !== undefined) {

                        var geojsonObject = $.geo.WKT.parse(rs[i].Deviation[0].Geometry.WGS84);

                        var geojson = {};
                        geojson['type'] = 'FeatureCollection';
                        geojson['features'] = [];
                        var newFeature = {
                            "type": "Feature",
                            "geometry": {
                                "type": geojsonObject.type,
                                "coordinates": geojsonObject.coordinates
                            },
                            "properties": {
                                "information": rs[i].Deviation[0].Message,
                                "newsId": rs[i].Id
                            }
                        }
                        geojson['features'].push(newFeature);
                        setMarkers(geojson, false);
                    }
                }

            },
            error: function (data) {
                console.log(JSON.stringify(data));
            }
        });
        showNews = true;
    }
    else{
        $('#news-rss').empty();
        clearNewsMarkers();
        showNews = false;
    }

}