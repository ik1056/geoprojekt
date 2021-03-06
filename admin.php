<?php
/**
 * Created by PhpStorm.
 * User: Ludvig
 * Date: 2018-04-20
 * Time: 18:17
 */
?>

<!DOCTYPE html>
<html lang="sv">
<meta charset="UTF-8">
<title>Karta</title>

<link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">
<link rel="stylesheet" href="plugins/styles/bootstrap.min.css">
<link rel="stylesheet" href="styles/stylesheet.css">

<script src="plugins/scripts/jquery.min.js"></script>

<script defer src="plugins/scripts/solid.js"></script>
<script defer src="plugins/scripts/brands.js"></script>
<script defer src="plugins/scripts/fontawesome.js"></script>

<script src="plugins/scripts/bootstrap.min.js"></script>
<script src="//code.jquerygeo.com/jquery.geo-1.0.0-rc1.min.js"></script>

<script src="scripts/rss.js"></script>
<body>
<a href="map.html" class="back-arrow"><i class="fas fa-arrow-left"></i></a>
<?php
if(!isset($_SESSION['user'])){
?>
    <div id="login-container" class="container">
        <div class="login-container">
            <h1 style="text-align:center;">Logga in</h1>
            <label for="username" class="label label-primary">Användarnamn</label>
            <input type="text" class="form-control" name="username" id="username" placeholder="användarnamn">
            <label for="password" class="label label-primary">Lösenord</label>
            <input type="password" class="form-control" name="password" id="password" placeholder="lösenord">
            <button id="btn_login" class="btn btn-primary">Logga in</button>
        </div>
        <script type="text/javascript">
            $(function() {
                $('#btn_login').on('click', function() {
                    var username = $('#username').val();
                    var password = $('#password').val();
                    $.ajax({
                        type: 'POST',
                        url: './php/route.php',
                        data: {'controller' : 'Controller', 'function' : 'login', 'username' : username, 'password' : password},
                        dataType: 'json',
                        success: function(data) {
                            console.log(data);
                            if(data === "success"){
                                location.reload();
                            }
                        },
                        error: function(data) {
                            console.log('Error: '+JSON.stringify(data));
                        }
                    })
                });
            })
        </script>
    </div>
<?php
}
else{
    ?>
    <script>alert("hej");</script>
<?php
}
?>

</body>
</html>
