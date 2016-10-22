'use strict';
const path = require('path');
const express = require('express');

class Router {
    static setRouter ({parentRouter}) {
        const router = new express.Router();

        router.use('/', express.static(path.join(__dirname, 'dist')));

        router.get('/', (req, res) => {
            res.render(path.join(__dirname, 'views', 'index'));
        });

        router.get('/kanban', (req, res) => {
            res.render(path.join(__dirname, 'views', 'kanban'));
        });

        parentRouter.use('/mobile', router);

        return {parentRouter};
    }
}

module.exports = {
    name: 'mobile',
    Router
};
