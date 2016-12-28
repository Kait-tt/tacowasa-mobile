'use strict';
require('babel-polyfill');
require('jquery.transit');
require('../../scss/kanban.scss');
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
let qrNum;

const $hitArea = document.getElementById('hitarea');
const $eventName = document.getElementById('eventname');
const $userList = document.getElementById('userlist');
const $taskNum = document.getElementById('task-num');

const myQRReader = new MyQRReader({lastQRsSize: 20, binThreshold: 125});
const deviceMotion = new DeviceMotion({threshold: 7, sleepTime: 1000});
const touchContent = new TouchContent($hitArea);
socket = new Socket();

function updateEventname (eventname) {
    $eventName.innerHTML = eventname;
}

Project.fetch(projectId)
    .then(_project => {
        project = _project;
        kanban = new Kanban(project, socket);

        project.users.forEach(user => {
            const $item = document.createElement('option');
            $item.innerText = user.username;
            $item.value = user.username;
            $userList.append($item);
        });

        myQRReader.start();
        document.body.appendChild(myQRReader.canvas);
    })
    .catch(err => console.error(err));

// QR Reader
myQRReader.on('recognized', ({qrs, qr, lastNum}) => {
    if (!isCatch && qrNum !== lastNum) {
        qrNum = lastNum;
        $taskNum.innerText = lastNum;
        socket.emit('qrHover', { taskId: qrNum === null ? null : Number(qrNum) });
    }
});

// Touch Events
touchContent.on('touchStart', ({e}) => {
    if (qrNum) {
        updateEventname('Catch');
        $hitArea.style.backgroundColor = 'red';

        isCatch = true;
        socket.emit('qrPick', {taskId: Number(qrNum)});
    }　else {
        $hitArea.style.backgroundColor = 'blue';
        updateEventname('Qr reading required');

        isCatch = false;
        socket.emit('qrPick', {taskId: null});
    }
});

touchContent.on('touchEnd', ({e}) => {
    updateEventname('touchend');
    $hitArea.style.backgroundColor = 'blue';

    isCatch = false;
    socket.emit('qrPick', {taskId: null});
});

touchContent.on('touchDouble', ({e}) => {
    if (qrNum) {
        location.href = `/mobile/edit?projectId=${projectId}&taskId=${qrNum}`;
    } else {
        console.log('qrコードを認識してください');
    }
});

touchContent.on('moveCircle', ({dist}) => {
    if (qrNum) {
        updateEventname('swipe');
        $hitArea.style.backgroundColor = 'yellow';

        const task = project.tasks.find(x => String(x.id) === String(qrNum));
        if (!task) { return; }
        socket.emit('qrScrollStage', {stageId: task.stageId, dy: dist * scrollK});
    }　else {
        updateEventname('touchmove');
        $hitArea.style.backgroundColor = 'blue';

        socket.emit('qrScrollUser', {dy: dist * scrollK});
    }
});

// DeviceMotion Event
deviceMotion.on('right', () => {
    if (!isCatch) { return; }
    const selectUsername = $userList.value;
    kanban.stepStage(qrNum, selectUsername, 1);
});

deviceMotion.on('left', () => {
    if (!isCatch) { return; }
    const selectUsername = $userList.value;
    kanban.stepStage(qrNum, selectUsername, -1);
});

deviceMotion.on('back', () => {
    if (!isCatch) { return; }
    kanban.stepAssign(qrNum, -1);
});

deviceMotion.on('front', () => {
    if (!isCatch) { return; }
    kanban.stepAssign(qrNum, 1);
});
