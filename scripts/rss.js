function getTrafficNews() {
    $.support.cors = true;
    var request =
        "<REQUEST>" +
        "<LOGIN authenticationkey='88597617d8524d5e9baf509b2b92a968' />" +
        "<QUERY objecttype='Situation' limit='10'>" +
        "<FILTER>" +
        "</FILTER>" +
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
            //console.log(rs);
            for (var i = 0; i < rs.length; i++) {
                var timePosted = rs[i].Deviation[0].CreationTime;
                var time = timePosted.split("T");
                var html = '<div class="traffic-news-item">';
                html +=         '<div class="traffic-rss-header">';
                html +=             '<span class="traffic-rss-headline">';
                html +=                 rs[i].Deviation[0].Creator;
                html +=             '</span>';
                html +=             '<span class="traffic-news-posted">';
                html +=                 time[0];
                html +=             '</span>';
                html +=         '</div>';
                html +=         '<div class="traffic-rss-message">';
                html +=             rs[i].Deviation[0].Message;
                html +=         '</div>';
                html +=         '<div class="traffic-rss-footer">';
                html += '       </div>';
                html +=     '</div>';
                //$('#news-rss').append(html);
            }
        },
        error: function (data) {
            console.log('ERROR: ' + JSON.stringify(data));
        }
    })
}

$(function () {
   //getTrafficNews();
});