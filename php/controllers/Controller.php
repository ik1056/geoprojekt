<?php
class Controller
{
    public function addMarker(){
        $type = "Point";
        $coords = filter_input(INPUT_POST, 'coords', FILTER_SANITIZE_STRING);
        $info = filter_input(INPUT_POST, 'info', FILTER_SANITIZE_STRING);

        $model = new Model();
        return $model->addMarkerToDB($type, $coords, $info);
    }

    public function removeMarker(){
        $id = filter_input(INPUT_POST, 'id', FILTER_SANITIZE_NUMBER_INT);
        $model = new Model();
        return $model->removeMarker($id);
    }

    public function updateMarker(){
        $id = filter_input(INPUT_POST, 'id', FILTER_SANITIZE_NUMBER_INT);
        $coords = filter_input(INPUT_POST, 'coords', FILTER_SANITIZE_STRING);
        $info = filter_input(INPUT_POST, 'info', FILTER_SANITIZE_STRING);
        $model = new Model();
        return $model->updateMarker($id, $coords, $info);
    }

    public function getMarkers(){
        $model = new Model();
        return $model->getMarkersFromDB();
    }

    public function updateDBFromCSV(){
        $model = new Model();
        return $model->updateDBFromCSV();
    }

    public function getCurrentWeather(){
        $model = new Model();
        $lat = filter_input(INPUT_POST, 'lat', FILTER_SANITIZE_STRING);
        $lng = filter_input(INPUT_POST, 'lng', FILTER_SANITIZE_STRING);
        return $model->getCurrentWeather($lat, $lng);
    }

    public function getTrafficInfo(){
        $model = new Model();
        return $model->getTrafficInfo();
    }

    public function login(){
        $username = filter_input(INPUT_POST, 'username', FILTER_SANITIZE_STRING);
        $password = filter_input(INPUT_POST, 'password', FILTER_SANITIZE_STRING);
        $model = new Model();
        return $model->login($username, $password);
    }
}