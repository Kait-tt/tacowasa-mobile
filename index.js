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

        router.get('/newtask', (req, res) => {
            res.render(path.join(__dirname, 'views', 'newtask'));
        });

        router.get('/qr_read', (req, res) => {
            res.render(path.join(__dirname, 'views', 'qr_read'));
        });

        router.get('/edit', (req, res) => {
            res.render(path.join(__dirname, 'views', 'edit'));
        });

        router.get('/test', (req, res) => {
            res.render(path.join(__dirname, 'views', 'test'));
        });


        parentRouter.use('/mobile', router);

        return {parentRouter};
    }
}

module.exports = {
    name: 'mobile',
    Router
};
