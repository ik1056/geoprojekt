var map;
var infowindow;
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

    loadDataFromDB();
}

function getWeatherData(feature){
    var lat = feature.getGeometry().get().lat();
    var lng = feature.getGeometry().get().lng();
    var info = feature.getProperty("information");

    $.ajax({
        type: "POST",
        url: "./php/route.php",
        data: {"controller":"Controller","function":"getCurrentWeather", "lat":lat, "lng":lng},
        dataType: "json",
        success:function(data){
            var content = "<span>Information:" + feature.getProperty('information') + "</span><br>"+
                "<span>Väder:</span><img src=" + data.weather.icon + " style='width: 25px; height: 25px;'/>" +
                "<span>"+data.temperature.temp+"</span>";

            infowindow = new google.maps.InfoWindow({
                content: content,
                options: {pixelOffset: new google.maps.Size(0, -30)},
                position: feature.getGeometry().get()
            });

            infowindow.open(map);
        }
    });
}

function loadDataFromDB(){
    $.ajax({
        type: "POST",
        url: "./php/route.php",
        data: {"controller":"Controller","function":"getMarkers"},
        dataType: "json",
        success: function (data) {
            map.data.addGeoJson(data);
            setMarkers();
        },
        error: function(data){
            console.log(JSON.stringify(data));
        }
    });
}
function setMarkers(){
    var bounds = new google.maps.LatLngBounds();
    google.maps.event.addListener(map.data, 'addfeature', function (e) {
        if (e.feature.getGeometry().getType() === 'Point') {
            bounds.extend(e.feature.getGeometry().get());
            map.fitBounds(bounds);
        }
    });
    google.maps.event.addListener(map.data, 'click', function (e) {
        if(infowindow) {
            infowindow.close();
        }
        getWeatherData(e.feature);
    });
}

$(document).ready(function(){
    $.support.cors = true;
    var test =
        "<REQUEST>" +
            "<LOGIN authenticationkey='88597617d8524d5e9baf509b2b92a968' />" +
            "<QUERY objecttype='Situation' limit='10'>"+
                "<FILTER>"+
                    "<OR>"+
                        "<ELEMENTMATCH>"+
                            "<EQ name='Deviation.ManagedCause' value='true'/>"+
                            "<IN name='Deviation.MessageType' value='Trafikmeddelande,Olycka' />"+
                        "</ELEMENTMATCH>"+
                        "<ELEMENTMATCH>"+
                            "<EQ name='Deviation.MessageType' value='Färjor' />"+
                            "<EQ name='Deviation.IconId' value='ferryServiceNotOperating' />"+
                        "</ELEMENTMATCH>"+
                        "<ELEMENTMATCH>"+
                            "<EQ name='Deviation.MessageType' value='Restriktion' />"+
                            "<EQ name='Deviation.MessageCode' value='Väg avstängd' />"+
                        "</ELEMENTMATCH>"+
                            "<ELEMENTMATCH>"+
                            "<EQ name='Deviation.MessageType' value='Vägarbete'/>"+
                            "<EQ name='Deviation.SeverityCode' value='5'/>"+
                        "</ELEMENTMATCH>"+
                        "<ELEMENTMATCH>"+
                            "<NE name='Deviation.MessageType' value='Vägarbete' />"+
                            "<GTE name='Deviation.SeverityCode' value='4' />"+
                        "</ELEMENTMATCH>"+
                    "</OR>"+
                "</FILTER>"+
            "</QUERY>"+
        "</REQUEST>";
    $.ajax({
       type: "POST",
       url: "http://api.trafikinfo.trafikverket.se/v1.3/data.json",
       contentType: "text/xml",
       dataType: "json",
       data: test,
       success: function(data){
           console.log(data);
           var rs = data.RESPONSE.RESULT[0].Situation;
           for (var i = 0; i < rs.length; i++) {
               var timePosted = rs[i].Deviation[0].CreationTime;
               var start, end;
               start = rs[i].Deviation[0].StartTime.split('T')[0];
               try{
                   end = rs[i].Deviation[0].EndTime.split('T')[0];
               }catch(e){
                   end = undefined;
               }

               var county = rs[i].Deviation[0].CountyNo[0];
               switch(county){
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
               var html = '<div class="traffic-news-item">';
               html += '<div class="traffic-rss-header">';
               html += '<span class="traffic-rss-headline">';
               html += county;
               html += '</span>';
               html += '<span class="traffic-news-posted">';
               if(end !== undefined)
                    html += start + " - " + end;
               else
                   html += start;
               html += '</span>';
               html += '</div>';
               if(rs[i].Deviation[0].RoadNumber !== undefined)
                    html += '<span>'+ rs[i].Deviation[0].RoadNumber +'</span>'
               html += '<div class="traffic-rss-message">';
               html += rs[i].Deviation[0].Message;
               html += '</div>';
               html += '<div class="traffic-rss-footer">';
               html += '       </div>';
               html += '</div>';
               $('#news-rss').append(html);

               if(rs[i].Deviation[0].Geometry.WGS84 !== undefined) {

                   var geojsonObject = $.geo.WKT.parse(rs[i].Deviation[0].Geometry.WGS84);

                   var geojson = {};
                   geojson['type'] = 'FeatureCollection';
                   geojson['features'] = [];
                   var newFeature = {
                       "type":"Feature",
                       "geometry":{
                           "type":geojsonObject.type,
                           "coordinates":geojsonObject.coordinates
                       },
                       "properties":{
                           "information":rs[i].Deviation[0].Message
                       }
                   }
                   geojson['features'].push(newFeature);
                   map.data.addGeoJson(geojson);
               }
           }
       },
        error: function(data){
           console.log(JSON.stringify(data));
        }
    });
    showWeatherWidget(60.4866813, 15.4060031);
});

function showWeatherWidget(lat, lng){
    $.ajax({
        type: "POST",
        url: "./php/route.php",
        data: {"controller":"Controller","function":"getCurrentWeather","lat":lat,"lng":lng},
        dataType: "json",
        success: function(data){
            console.log(data);

            $('#weather').append("<img src='" + data.weather.icon + "' style='width:40px;'><span>" + data.weather.desc+ "</span> <span>" + data.temperature.temp + "&deg;C</span>");
        },
        error: function(data){
            console.log(JSON.stringify(data));
        }
    });
}