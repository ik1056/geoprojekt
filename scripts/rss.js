function getTrafficNews() {
    $.support.cors = true;
    var request =
        "<REQUEST>" +
        "<LOGIN authenticationkey='88597617d8524d5e9baf509b2b92a968' />" +
        "<QUERY objecttype='Situation' limit='10'>" +
        "<FILTER>" +
        "</FILTER>"+
        "</QUERY>" +
        "</REQUEST>";
    $.ajax({
        type: 'POST',
        url: "http://api.trafikinfo.trafikverket.se/v1.3/data.json",
        contentType: 'text/xml',
        dataType: 'json',
        data: request,
        success: function (data) {
            var rs = data.RESPONSE.RESULT[0].Situation;
            console.log(rs);
            console.log(data);
            for(var i = 0; i < rs.length; i++) {
                var html =
                    '<div class="traffic-news-item">' +
                    '<div class="traffic-rss-header">'+
                    '</div>'+
                    '<div class="traffic-rss-message">' +
                    '</div>'+
                    '<div class="traffic-rss-footer">' +
                    '</div>'+
                    '</div>'
            }
        },
        error: function (data) {
            console.log('ERROR: ' + JSON.stringify(data));
        }
    })
}

$(function () {
    getTrafficNews();
});