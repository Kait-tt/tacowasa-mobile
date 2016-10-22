'use strict';
require('babel-polyfill');
require('../../scss/kanban.scss');
const Project = require('../models/project');
const Socket = require('../models/socket');

let project, socket;

Project.fetch(getProjectId())
    .then(_project => {
        project = _project;
        socket = new Socket();
        socket.join(project.id);
        socketInit();
    })
    .catch(err => console.error(err));

function socketInit () {
    socket.on('joinRoom', ({username}) => console.log(username));
}

function getProjectId () {
    const search = location.search;
    if (!search) { return null; }
    const qs = search.slice(1).split('&').map(q => q.split('='));
    const q = qs.find(x => x.length && x[0] === 'projectId');
    return q && q.length > 1 && q[1] || null;
}
