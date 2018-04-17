<?php
/**
 * Created by PhpStorm.
 * User: Ludvig
 * Date: 2018-03-19
 * Time: 17:13
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/html; charset=utf-8');
spl_autoload_register(function ($className) {

    $pathControllers = './controllers/' . $className . '.php';
    $pathModels = './models/' . $className . '.php';
    $thispath = './' . $className . '.php';

    if (file_exists($pathControllers)) {
        include_once $pathControllers;
    }
    if (file_exists($pathModels)) {
        include_once $pathModels;
    }
    if (file_exists($thispath)) {
        include_once $thispath;
    }
});

if (isset($_POST['controller']) &&
    isset($_POST['function'])   ){
    $controller = $_POST['controller'];
    $function = $_POST['function'];

    switch($controller){
        case 'Controller' :
            $controller = new Controller();
            break;
        default:
            $controller = new Controller();
            break;
    }
    echo json_encode($controller->{$function}());
}