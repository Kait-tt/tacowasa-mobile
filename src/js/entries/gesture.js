'use strict';
require('babel-polyfill');
require('jquery.transit');
require('../../scss/kanban.scss');
const _ = require('lodash');
const Util = require('../modules/util');
const MyQRReader = require('../models/myqrreader');
const Project = require('../models/project');
const Socket = require('../models/socket');
const Vector = require('../models/vector');
const Kanban = require('../viewmodels/kanban');

const {projectId} = Util.parseURLQuery();

let project, socket, kanban;
const myQRReader = new MyQRReader({lastQRsSize: 20, binThreshold: 125});

const multiple_scroll = 100;

const el_hitarea = document.getElementById('hitarea');
const el_eventname = document.getElementById('eventname');

let isMotion = false;
let isCatch = false;

let didFirstTap = false;

const updateEventname = function(eventname) {
    el_eventname.innerHTML = eventname;
};


Project.fetch(projectId)
    .then(_project => {
        project = _project;
        socket = new Socket();
        kanban = new Kanban(project, socket);

        const $userList = $('#userlist');
        project.users.forEach(user => {
            const $item = $('<option>').html(user.username).val(user.username);
            $userList.append($item);
        });

        myQRReader.start();
    })
    .catch(err => console.error(err));



//emit hover pick

let didqr;

let content = null;
$(document).ready(function() {
    $('#sample').on('DOMSubtreeModified propertychange', function() {
        alert('Change!');
    });
    $('#click_me').click(function() {
        $('#sample').text('Change!');
    });
});

myQRReader.on('recognized', ({qrs, qr, lastNum}) => {
    if (!isCatch && didqr !== lastNum) {
        didqr = lastNum;
        socket.emit('qrHover', { taskId: Number(lastNum) });
    }
});


el_hitarea.addEventListener('touchstart', function(event) {
    event.preventDefault();

    if (!didFirstTap) {

        didFirstTap = true;


        setTimeout(function() {
            didFirstTap = false;
        }, 350);
    } else {
        console.log("ダブルタップ");
        if (didqr) {
            location.href = `/mobile/edit?projectId=${projectId}&taskId=${didqr}`;
        } else {
            console.log("qrコードを認識してください")
        }

        didFirstTap = false;
    }

    if (didqr) {
        updateEventname('Catch');
        el_hitarea.style.backgroundColor = 'red';
        isCatch = true;
        socket.emit('qrPick', {taskId: Number(didqr)});
    }　else {
        el_hitarea.style.backgroundColor = 'blue';
        updateEventname('Qr reading required');
        isCatch = false;
        socket.emit('qrPick', {taskId: null});
    }

}, false);

let beforeX = null;
let beforeY = null;
el_hitarea.addEventListener('touchmove', function(event) {
    event.preventDefault();
    const {pageX: x, pageY: y} = event.changedTouches[0];

    var center = new Vector(270, 470);
    var firstP = new Vector(beforeX, beforeY);
    var afterP = new Vector(x, y);
    var dist = Vector.calcMoveAngle(firstP,center,afterP) * multiple_scroll;

    ([beforeX, beforeY] = [x, y]);

    if (didqr) {
        var qrid = didqr;
        const task = project.tasks.find(x => String(x.id) === qrid);

        updateEventname('swipe');
        el_hitarea.style.backgroundColor = 'yellow';
        isCatch = true;

        socket.emit('qrScrollStage', {stageId: task.stageId, dy: dist});
    }　else {
        updateEventname('touchmove');
        el_hitarea.style.backgroundColor = 'blue';
        isCatch = false;

        socket.emit('qrScrollUser', {dy: dist});
    }
}, false);

el_hitarea.addEventListener('touchend', function(event) {
    updateEventname('touchend');
    el_hitarea.style.backgroundColor = 'blue';
    isCatch = false;
    socket.emit('qrPick', {taskId: null});
}, false);


// DeviceMotion Event
window.addEventListener("devicemotion", devicemotionHandler, false);

const moveStageDebounced = _.debounce(moveStage, 1000);

// 加速度が変化
function devicemotionHandler(event) {
    if (isCatch && !isMotion) {
        const l = 7;
        const {x, y} = event.acceleration;
        console.log(x, y);

        if (x > l) {
            moveStageDebounced('right');
        } else if (x < -l) {
            moveStageDebounced('left');
        } else if (y > l) {
            moveStageDebounced('up');
        } else if (y < -l) {
            moveStageDebounced('down');
        } else {
            return;
        }
    }
}

function moveStage(dir) {
    if (dir === 'right') { right(); }
    else if (dir === 'left')  { left(); }
    else if (dir === 'down')  { down(); }
    else { return; }

    isMotion = true;
    setTimeout(() => { isMotion = false; }, 2000);
}

function right() {
    console.log("right");
    var qrid = didqr;
    const task = project.tasks.find(x => String(x.id) === qrid);
    const currentStage = project.stages.find(x => x.id === task.stageId);
    const stageNames = ['issue', 'backlog', 'todo', 'doing', 'review', 'done'];
    const currentPos = stageNames.indexOf(currentStage.name);
    const afterPos = currentPos + 1;

    var username = document.getElementById("userlist").value;
    const selectUser = project.users.find(x => x.username === username);

    if (afterPos >= stageNames.length) {
        // 次のステージには行けない
    }
    const afterStage = project.stages.find(x => x.name === stageNames[afterPos]);

    let afterUserId;
    if (afterStage.assigned) {
        if (task.userId == null) {
            afterUserId = selectUser.id;
        } else {
            afterUserId = task.userId;
        }
    } else {
        afterUserId = null;
    }
    socket.emit('updateTaskStatusAndOrder', {
        taskId: qrid,
        updateParams: {
            stageId: afterStage.id,
            userId: afterUserId
        }
    });
}

function left() {
    console.log("left");
    var qrid = didqr;
    const task = project.tasks.find(x => String(x.id) === qrid);
    const currentStage = project.stages.find(x => x.id === task.stageId);
    const stageNames = ['issue', 'backlog', 'todo', 'doing', 'review', 'done'];
    const currentPos = stageNames.indexOf(currentStage.name);
    const afterPos = currentPos - 1;
    if (afterPos == 0) {
        // 次のステージには行けない
    }
    const afterStage = project.stages.find(x => x.name === stageNames[afterPos]);

    let afterUserId;
    if (afterStage.assigned) {
        if (currentStage.assigned) {
            afterUserId = task.userId;
        } else {
            // アサインする場合
        }
    } else {
        afterUserId = null;
    }

    socket.emit('updateTaskStatusAndOrder', {
        taskId: qrid,
        updateParams: {
            stageId: afterStage.id,
            userId: afterUserId
        }
    });

}

function down(){
    console.log("down");

    var qrid = didqr;
    const task = project.tasks.find(x => String(x.id) === qrid);
    const currentStage = project.stages.find(x => x.id === task.stageId);

    var username = document.getElementById("userlist").value;
    const user = project.users.find(x => x.username === username);
    let nextUserId = null;
    if (!user.nextMemberId) {
        const nextUser = project.users.find(x => x.member.id === user.member.nextMemberId);
        nextUserId = nextUser.id;
    }
    socket.emit('updateTaskStatusAndOrder', {
        taskId: qrid,
        updateParams: {
            stageId: currentStage.id,
            userId: nextUserId
        }
    });
}
