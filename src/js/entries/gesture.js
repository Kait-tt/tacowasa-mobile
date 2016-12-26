'use strict';
require('babel-polyfill');
require('jquery.transit');
require('../../scss/kanban.scss');
const _ = require('lodash');
const MyQRReader = require('../models/myqrreader');
const Project = require('../models/project');
const Socket = require('../models/socket');
const Vector = require('../models/vector');

let project, socket;
const myQRReader = new MyQRReader({lastQRsSize: 20, binThreshold: 125});

const multiple_scroll = 100;


// 要素ら

var el_hitarea = document.getElementById('hitarea');
var el_eventname = document.getElementById('eventname');
var el_x = document.getElementById('x');
var el_y = document.getElementById('y');

var isMotion = false;
var isCatch = false;
// 表示をアップデートする関数群

var didFirstTap = false;

var updateXY = function(event) {
    el_x.innerHTML = event.changedTouches[0].pageX;
    el_y.innerHTML = event.changedTouches[0].pageY;
};
var updateEventname = function(eventname) {
    el_eventname.innerHTML = eventname;
};



//emit hover pick

var didqr;

var content = null;
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
            location.href = "/mobile/edit?projectId=lFs5L08Gugfi&taskId=" + didqr;
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

el_hitarea.addEventListener('touchmove', function(event) {
    event.preventDefault();
    var didy= el_y.textContent;
    var didx =el_x.textContent;
    var dify = event.changedTouches[0].pageY;
    var difx = event.changedTouches[0].pageX;

    var center = new Vector(270,470);
    var firstP = new Vector(didx,didy);
    var afterP = new Vector(difx,dify);
    var dist = Vector.calcMoveAngle(firstP,center,afterP) * multiple_scroll;

    updateXY(event);


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
    updateXY(event);
    el_hitarea.style.backgroundColor = 'blue';
    isCatch = false;
    socket.emit('qrPick', {taskId: null});
}, false);




Project.fetch(getProjectId())
    .then(_project => {
        project = _project;
        socket = new Socket();
        socket.join(project.id);
        socketInit();

        var user = [];

        for (var i in project.users) {
            user.push(project.users[i].username);
        }

        $(function() {
            var count, d, plist;
            for (count = 0; count < user.length; count++) {
                plist = $('<option>').html(user[count]).val(user[count]);
                $("#userlist").append(plist);
            }
        });

        myQRReader.start();
    })
    .catch(err => console.error(err));

// DeviceMotion Event
window.addEventListener("devicemotion", devicemotionHandler, false);

function Edit_task(event) {
    if (didqr) {
        location.href = "/mobile/edit?projectId=lFs5L08Gugfi&taskId=" + didqr;
    } else {
        alert("タスクのQRコードを認識してください");
    }
}


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

function socketInit() {
    socket.on('createTask', ({ task }) => project.tasks.push(task));

    socket.on('archiveTask', ({ task }) => {
        project.tasks.find(x => x.id === task.id).stageId = task.stageId;
    });

    socket.on('updateTaskStatus', ({ task: _task }) => {
        const task = project.tasks.find(x => x.id === _task.id);
        task.stageId = _task.stageId;
        task.userId = _task.userId;
    });

    socket.on('updateTaskStatusAndOrder', ({ task: _task }) => {
        const task = project.tasks.find(x => x.id === _task.id);
        task.stageId = _task.stageId;
        task.userId = _task.userId;
    });

    socket.on('updateTaskContent', ({ task: _task }) => {
        const task = project.tasks.find(x => x.id === _task.id);
        task.title = _task.title;
        task.body = _task.body;
        task.costId = _task.costId;
    });

    socket.on('updateTaskWorkingState', ({ task, isWorking }) => {
        project.tasks.find(x => x.id === task.id).isWorking = isWorking;
    });

    socket.on('attachLabel', ({ task, label }) => {
        project.tasks.find(x => x.id === task.id).labels = task.labels;
    });

    socket.on('detachLabel', ({ task, label }) => {
        project.tasks.find(x => x.id === task.id).labels = task.labels;
    });

    socket.on('error', () => {
        console.error('ソケットが接続できませんでした。');
    });

    socket.on('reconnect', () => {
        console.debug('ソケットを再接続しました。');
    });

    socket.on('disconnect', () => {
        console.error('ソケットが切断されました。');
    });

    socket.on('reconnect_error', () => {
        console.error('ソケットを再接続しています。');
    });

    socket.on('operationError', res => {
        console.error('操作エラー', res);
    });
}

function getProjectId() {
    const search = location.search;
    if (!search) {
        return null;
    }
    const qs = search.slice(1).split('&').map(q => q.split('='));
    const q = qs.find(x => x.length && x[0] === 'projectId');
    return q && q.length > 1 && q[1] || null;
}
