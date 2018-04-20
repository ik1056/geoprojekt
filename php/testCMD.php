<?php
/**
 * Created by PhpStorm.
 * User: Ludvig
 * Date: 2018-04-19
 * Time: 21:38
 */

include 'models/Model.php';

$m = new Model();
echo $m->addMarkerToDB('Point', '88,22', 'Test igen');
?>
<script> console.log(<?=$m->getMarkersFromDB()?>); </script>

