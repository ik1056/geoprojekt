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