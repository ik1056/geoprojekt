<?php
class Controller
{

    public function createDB(){
        $model = new Model();
        return $model->createDB();
    }
    public function addMarkerToDB(){
        //$type, $coords, $info
        $type = $_POST['type'];
        $coords = $_POST['coords'];
        $info = $_POST['info'];

        $type = filter_input(INPUT_POST, 'type', FILTER_SANITIZE_STRING);
        $coords = filter_input(INPUT_POST, 'coords', FILTER_SANITIZE_STRING);
        $info = filter_input(INPUT_POST, 'info', FILTER_SANITIZE_STRING);

        $model = new Model();
        return $model->addMarkerToDB($type, $coords, $info);
    }
}