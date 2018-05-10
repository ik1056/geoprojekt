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

    public function removeMarker($id){
        $pdo = $this->getPDOConnection();
        $statement = $pdo->prepare("DELETE FROM features WHERE id = :id");
        $statement->bindParam(":id", $id);
        $statement->execute();
        $pdo = null;

        return 'done';
    }

    public function updateMarker($id, $coords, $info){
        $pdo = $this->getPDOConnection();
        $statement = $pdo->prepare("UPDATE features SET coords = :coords, info = :info WHERE id = :id");
        $statement->bindParam(":id", $id);
        $statement->bindParam(":coords", $coords);
        $statement->bindParam(":info", $info);
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
            $lat = floatval($latlng[0]);
            $lng = floatval($latlng[1]);
            array_push($features['features'],
                array(
                    "type" => "Feature",
                    "geometry" => array(
                        "type" => utf8_encode($feature['type']),
                        "coordinates" => array($lat, $lng)
                    ),
                    "properties" => array(
                        "information" => $feature['info'],
                        "feature_id" => $feature['id']
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
            $coords = $data[1];
            $this->addMarkerToDB($data[0], $coords, $data[2]);
            array_push($res,
                array(
                    'type' => utf8_encode($data[0]),
                    'coords' => $data[1],
                    'info' => utf8_encode($data[2])
                )
            );
        }
        return $res;
    }

    public function updateCSVFromDB(){
        file_put_contents("./dbs/backup.csv", "");
        $file = fopen("./dbs/backup.csv", "a");
        $data = $this->getMarkersFromDB();
        foreach($data['features'] as $d){
            $line = array("type" => 'Point',
                "coords" => $d['geometry']['coordinates'][0] .",". $d['geometry']['coordinates'][1],
                "info" => $d['properties']['information']);
            fputcsv($file, $line, ";");
        }

        fclose($file);

        return "done";

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

    public function login($username, $password){
        $usr = $username;
        $pwd = $password;
        $pdo = $this->getPDOConnection();
        $query = $pdo->prepare(
            "SELECT password FROM Users WHERE username = :username LIMIT 1");
        $query->bindParam(":username", $usr);
        $query->execute();
        $res = $query->fetch();
        $pdo = null;
        if($res != null){
            if(password_verify($pwd, $res[0])) {
                return "success";
            }
            else
                return "error";
        }
        else{
            return "error";
        }
    }

    public function register(){
        $username = "admin";
        $password = password_hash("123", PASSWORD_BCRYPT);
        $pdo = $this->getPDOConnection();
        $statement = $pdo->prepare("INSERT INTO users (username, password) VALUES (:username, :password)");
        $statement->bindparam(":username", $username);
        $statement->bindParam(":password", $password);
        $statement->execute();

        $pdo = null;
        return "success";
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