<?php

class Model
{
    public function addMarkerToDB($type, $coords, $info){
        $pdo = $this->getPDOConnection();
        $statement = $pdo->prepare("INSERT INTO features (type, coords, info) VALUES (:type, :coords, :info);");
        $statement->bindParam(':type',$type);
        $statement->bindParam(':coords', $coords);
        $statement->bindParam(':info', $info);
        $statement->execute();

        $pdo = null;

        return 'done';
    }

    public function getMarkersFromDB(){
        $pdo = $this->getPDOConnection();
        $query = $pdo->query("SELECT * FROM features;");
        $res = $query->fetchAll();
        $pdo = null;

        $features = array(
            "type" => "FeatureCollection",
            "features" => array()
        );
        foreach($res as $feature){
            $latlng = str_getcsv($feature['coords'], ',');
            $lat = intval($latlng[0]);
            $lng = intval($latlng[1]);
            array_push($features['features'],
                array(
                    "type" => "Feature",
                    "geometry" => array(
                        "type" => utf8_encode($feature['type']),
                        "coordinates" => array($lat, $lng)
                    ),
                    "properties" => array(
                        "information" => utf8_encode($feature['info'])
                    )
                )
            );
        }
        return $features;
    }

    public function updateDBFromCSV(){
        //TODO: Ladda in CSV-filen och fyll Databasen.
        $pdo = $this->getPDOConnection();
        $pdo->exec("DELETE FROM features;");
        $pdo = null;

        $file = file('./dbs/backup.csv');
        $res = array();
        foreach($file as $line){
            $data = str_getcsv($line, ";");

            $this->addMarkerToDB($data[0], $data[1], $data[2]);

            array_push($res,
                array(
                    'type' => $data[0],
                    'coords' => $data[1],
                    'info' => $data[2]
                )
            );
        }
        return $res;
    }

    public function getCurrentWeather($lat, $lng){
        //TODO: Ladda in data från en vädertjänst, t.ex. yr.no eller AccuWeather.
        $openweather = "http://api.openweathermap.org/data/2.5/weather?lat=$lat&lon=$lng&units=metric&APPID=06264aa52c97f29f7a46cec83ab8aeb9";
        $res = file_get_contents($openweather);
        $res = json_decode($res, true);

        $weather = array("weather" =>
            array("condition" => $res['weather'][0]['main'],
                "desc" => $res['weather'][0]['description'],
                "icon" => "http://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/widgets/".$res['weather'][0]['icon'].".png"
            ),
            "temperature" => array(
                "temp" => $res['main']['temp']
            )
        );
        return $weather;
    }

    public function getTrafficInfo(){
        //TODO: Ladda in data om trafikhändelser.
    }

    private function getPDOConnection(): PDO
    {
        $db = 'sqlite:./dbs/geodataDB.sqlite';
        $pdo = null;
        try {
            $pdo = new PDO($db);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            return $pdo;
        } catch (PDOException $ex) {
            echo "PDOError exception: ", $ex->getMessage();
            $pdo = null;
            die();
        }
    }
}