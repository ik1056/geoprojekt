<?php
/**
 * Created by PhpStorm.
 * User: Ludvig
 * Date: 2018-04-19
 * Time: 21:38
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

include 'models/Model.php';

$m = new Model();
/*echo $m->addMarkerToDB('Point', '88,22', 'Test igen');
echo $m->addMarkerToDB('Point', '88,22', 'Test igen');
echo $m->addMarkerToDB('Point', '88,22', 'Test igen');
echo $m->addMarkerToDB('Point', '88,22', 'Test igen');
echo $m->addMarkerToDB('Point', '88,22', 'Test igen');
echo $m->addMarkerToDB('Point', '88,22', 'Test igen');
print_r($m->updateDBFromCSV());
echo '<br><br>';
print_r($m->getMarkersFromDB());*/
print_r($m->getCurrentWeather("59.930764","15.435104000000024"));
?>
<!--<script> //console.log(<?=$m->getMarkersFromDB()?>); </script>-->

