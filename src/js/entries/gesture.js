'use strict';
require('babel-polyfill');
require('jquery.transit');
require('bootstrap');
require('bootstrap-select');
require('../../scss/gesture.scss');
const Util = require('../modules/util');
const Project = require('../models/project');
const Socket = require('../models/socket');
const Kanban = require('../viewmodels/kanban');
const MyQRReader = require('../models/myqrreader');
const DeviceMotion = require('../models/device_motion');
const TouchContent = require('../models/touch_content');

const {projectId} = Util.parseURLQuery();

let project, socket, kanban;

const scrollK = 20;
let isCatch = false;
let qrNum = null;

const $hitArea = document.getElementById('hitarea');

const myQRReader = new MyQRReader({lastQRsSize: 20, binThreshold: 125});
const deviceMotion = new DeviceMotion({threshold: 7, sleepTime: 1000});
const touchContent = new TouchContent($hitArea);
socket = new Socket();

let topUsername;

Project.fetch(projectId)
    .then(_project => {
        project = _project;
        kanban = new Kanban(project, socket);

        topUsername = project.users.find(x => !x.member.prevMemberId).username;

        myQRReader.start();
        // document.body.appendChild(myQRReader.canvas);

        $('select').selectpicker('refresh');
    })
    .catch(err => console.error(err));

// QR Reader
myQRReader.on('recognized', ({qrs, qr, lastNum}) => {
    if (!isCatch && qrNum !== lastNum) {
        qrNum = lastNum;
        socket.emit('qrHover', { taskId: qrNum === null ? null : Number(qrNum) });
    }
});

// Touch Events
touchContent.on('touchStart', ({e}) => {
    if (qrNum) {
        $hitArea.style.backgroundColor = 'red';

        isCatch = true;
        socket.emit('qrPick', {taskId: Number(qrNum)});
    } else {
        $hitArea.style.backgroundColor = 'blue';

        isCatch = false;
        socket.emit('qrPick', {taskId: null});
    }
});

touchContent.on('touchEnd', () => {
    $hitArea.style.backgroundColor = 'blue';

    isCatch = false;
    socket.emit('qrPick', {taskId: null});
});

touchContent.on('touchDouble', () => {
    if (qrNum) {
        location.href = `/mobile/edit?projectId=${projectId}&taskId=${qrNum}`;
    } else {
        location.href = `/mobile/newtask?projectId=${projectId}`;
    }
});

touchContent.on('moveCircle', ({dist}) => {
    if (qrNum) {
        $hitArea.style.backgroundColor = 'yellow';

        const task = project.tasks.find(x => String(x.id) === String(qrNum));
        if (!task) { return; }
        const stage = project.stages.find(x => x.id === task.stageId);

        if (stage.assigned) {
            socket.emit('qrScrollUser', {dy: dist * scrollK});
        } else {
            socket.emit('qrScrollStage', {stageId: task.stageId, dy: dist * scrollK});
        }
    } else {
        $hitArea.style.backgroundColor = 'blue';

        socket.emit('qrScrollUser', {dy: dist * scrollK});
    }
});

// DeviceMotion Event
deviceMotion.on('right', () => {
    if (!isCatch) { return; }
    kanban.stepStage(qrNum, topUsername, 1);
});

deviceMotion.on('left', () => {
    if (!isCatch) { return; }
    kanban.stepStage(qrNum, topUsername, -1);
});

deviceMotion.on('back', () => {
    if (!isCatch) { return; }
    kanban.stepAssign(qrNum, -1);
});

deviceMotion.on('front', () => {
    if (!isCatch) { return; }
    kanban.stepAssign(qrNum, 1);
});
