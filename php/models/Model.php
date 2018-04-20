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
    }

    public function updateDBFromCSV(){
        //TODO: Ladda in CSV-filen och fyll Databasen.
    }

    public function getCurrentWeather(){
        //TODO: Ladda in data från en vädertjänst, t.ex. yr.no eller AccuWeather.
    }

    public function getTrafficInfo(){
        //TODO: Ladda in data om trafikhändelser.
    }

    public function createDB(){
        $pdo = $this->getPDOConnection();
        /*$pdo->exec("CREATE TABLE requiem_rosters (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(256) NOT NULL)");

        $pdo->exec("
        CREATE TABLE requiem_raiders (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        roster INT UNSIGNED REFERENCES requiem_rosters(id),
        name VARCHAR(256) NOT NULL,
        realm VARCHAR(256) NOT NULL,
        thumbnail VARCHAR(256) NOT NULL,
        armory VARCHAR(256) NOT NULL,
        class VARCHAR(256) NOT NULL,
        role VARCHAR(256) NOT NULL,
        rank VARCHAR(256) NOT NULL
        )");

        $pdo->exec("CREATE TABLE requiem_progress (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        roster INT UNSIGNED REFERENCES requiem_rosters(id),
        raid_name VARCHAR(256) NOT NULL,
        difficulty VARCHAR(256) NOT NULL,
        total_bosses INT UNSIGNED NOT NULL,
        bosses_killed INT UNSIGNED NOT NULL
        )");

        $pdo->exec("
        CREATE PROCEDURE requiem_getRaidRoster(IN in_id INT)
        BEGIN
        SELECT roster.title, raider.name, raider.realm, raider.thumbnail, raider.armory, raider.class, raider.role, raider.rank
        FROM requiem_rosters roster, requiem_raiders raider
        WHERE roster.id = in_id AND roster.id = raider.roster;
        END");

        $pdo->exec("
        CREATE PROCEDURE requiem_addRoster(IN in_title VARCHAR(256))
        BEGIN
        INSERT INTO requiem_rosters (title) VALUES (in_title);
        END");

        $pdo->exec("
        CREATE PROCEDURE requiem_addRaider(
                IN in_roster INT,
                IN in_name VARCHAR(256),
                IN in_realm VARCHAR(256),
                IN in_thumbnail VARCHAR(256),
                IN in_armory VARCHAR(256),
                IN in_class VARCHAR(256),
                IN in_role VARCHAR(256),
                IN in_rank VARCHAR(256))
        BEGIN
        INSERT INTO requiem_raiders (roster, name, realm, thumbnail, armory, class, role, rank)
        VALUES (in_roster, in_name, in_realm, in_thumbnail, in_armory, in_class, in_role, in_rank);
        END");

        $pdo->exec("
        CREATE PROCEDURE requiem_getProgress(IN in_id INT)
        BEGIN
        SELECT roster.title, prog.raid_name, prog.difficulty, prog.total_bosses, prog.bosses_killed
        FROM requiem_rosters roster, requiem_progress prog
        WHERE roster.id = in_id AND prog.roster = in_id;
        END");

        $pdo->exec("
        CREATE PROCEDURE requiem_addProgress(IN in_roster INT,
                IN in_raid_name VARCHAR(256),
                IN in_difficulty VARCHAR(256),
                IN in_total INT,
                IN in_killed INT)
        BEGIN
        DELETE FROM requiem_progress
        WHERE difficulty = in_difficulty AND raid_name = in_raid_name;
        INSERT INTO requiem_progress (raid_name, difficulty, total_bosses, bosses_killed)
        VALUES (in_raid_name, in_difficulty, in_total, in_killed);
        END");
        $pdo = null;*/
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