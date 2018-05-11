<?php

//Klass för att hantera all databas-kommunikation enligt MVC-mönstret.
class Model
{
    //Funktion för att lägga till en ny punkt i databasen.
    // funktionen tar emot 3st in-parametrar: Typ av Feature (Typ som i t.ex. Point), koordinater (LAT,LNG)
    // och informationen som är kopplad till punkten.
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

    //Funktion för att ta bort en punkt i databasen.
    //Punkten refereras till genom ett ID.
    public function removeMarker($id){
        $pdo = $this->getPDOConnection();
        $statement = $pdo->prepare("DELETE FROM features WHERE id = :id");
        $statement->bindParam(":id", $id);
        $statement->execute();
        $pdo = null;

        return 'done';
    }

    //Funktion för att uppdatera en punkt baserat på ID.
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

    //Funktion för att hämta ut alla punkter ur databasen.
    // Dessa punkter returneras i form av GeoJSON - se http://geojson.org för mer information.
    public function getMarkersFromDB(){
        $pdo = $this->getPDOConnection();
        $query = $pdo->query("SELECT * FROM features;");
        $res = $query->fetchAll();
        $pdo = null;

        //Påbörjar uppbyggnaden av GeoJSON-formatet genom att skapa en FeatureCollection.
        $features = array(
            "type" => "FeatureCollection",
            "features" => array()
        );
        //För varje punkt i databasen, lägg in punkten som en Feature i vår FeatureCollection $features.
        foreach($res as $feature){
            //Koordinaterna är sparade som en sträng där latitud och longitud separeras med ett kommatecken
            // t.ex. '63,12'
            $latlng = str_getcsv($feature['coords'], ',');
            //Bygg upp en Feature baserat på det resultat som kom från databasen.
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

    //Funktion för att uppdatera databasen med en CSV-fil.
    //Denna fil används som backup ifall databasen tappar data eller blir korrupt.
    //Funktionen rensar databasen och laddar sedan in allt som finns i CSV-filen.
    public function updateDBFromCSV(){
        //Töm databasen på punkter.
        $pdo = $this->getPDOConnection();
        $pdo->exec("DELETE FROM features;");
        $pdo = null;

        //Läs in CSV-filen och gå igenom varje rad
        // där varje rad representerar en punkt och är i formatet CSV.
        //T.ex. Point;63,12;"Information om min marker"
        $file = file('./dbs/backup.csv');
        $res = array();
        foreach($file as $line){
            $data = str_getcsv($line, ";");

            //Lägg till punkten i databasen
            $this->addMarkerToDB($data[0], $data[1], $data[2]);
            //Bygg även upp ett resultat som sedan returneras ut.
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

    //Funktion för att uppdatera CSV-filen med en databas.
    //Funktionen är till för att kunna uppdatera backup-filen istället för att tappa all data som läggs in i enbart databasen.
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

    //Funktion för att hämta värderinformation baserat på koordinater.
    //Funktionen använder sig utav OpenWeatherMap.org
    public function getCurrentWeather($lat, $lng){
        $openweather = "http://api.openweathermap.org/data/2.5/weather?lat=$lat&lon=$lng&units=metric&APPID=06264aa52c97f29f7a46cec83ab8aeb9";
        $res = file_get_contents($openweather);
        $res = json_decode($res, true);

        //Bygger upp ett resultat med en simpel JSON-struktur.
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

    //Funktion för att logga in en användare.
    //Om användaren finns kommer "success" att returneras - annars "error".
    //Lösenord är hashade enligt B-CRYPT.
    public function login($username, $password){
        $usr = strtolower($username);
        $pwd = $password;
        $pdo = $this->getPDOConnection();
        //Hämtar endast det krypterade lösenordet där username är detsamma som input.
        $query = $pdo->prepare(
            "SELECT password FROM Users WHERE username = :username LIMIT 1");
        $query->bindParam(":username", $usr);
        $query->execute();
        $res = $query->fetch();
        $pdo = null;
        //Om det finns något resultat körs "password_verify(password, hashed_password)" som automatiskt
        // känner av vilken kryptering som är aktiv och jämför det hashade lösenordet med det som finns i databasen.
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

    //Temporär funktion för att registrera en admin.
    //Username: Admin
    //Password: 123
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