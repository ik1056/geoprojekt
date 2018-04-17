<?php
class Controller
{

    public function createDB(){
        $model = new Model();
        return $model->createDB();
    }
}