'use strict';
require('babel-polyfill');
require('jquery.transit');
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

        project.users;
        project.labels;

        var user = [];

        for (var i in project.users){
            user.push(project.users[i].username);
        }


        $(function() {
            var count, d, plist;
            for (count = 0; count < user.length; count++) {
                plist = $('<option>').html(user[count]).val(user[count]);
                $("#userlist").append(plist);
            }
        });

    })
    .catch(err => console.error(err));


(function() {
    var $arrow;
    var $button;
    var $window;
    var stageW;
    var stageH;

    var isMotion;
    var isCatch;


    $(function() {
        $arrow = $("#arrow");
        var catch_button = $("#catch");
        var edit_button = $("#edit");

        $window = $(window);

        isMotion = false;
        isCatch = false;

        $(window).on("resize", resizeHandler);
        resizeHandler();

        catch_button.get(0).addEventListener("click", Catch_release, false);
        edit_button.get(0).addEventListener("click", Edit_task, false);

        // DeviceMotion Event
        window.addEventListener("devicemotion", devicemotionHandler, false);
    });

    function Catch_release(event) {
        if ($("#display_data").text() != "")
            if (isCatch == true) {
                isCatch = false;
                alert("タスクのQRコードを認識してください");
            } else {
                isCatch = true;
                console.log("Catch");
            }
    }

    function Edit_task(event) {
        if ($("#display_data").text() != "")
            {
                var qrid = $("#display_data").text();
                var QRCODE = localStorage.getItem('qrcode');
                location.href = "/mobile/edit?projectId=lFs5L08Gugfi&taskId="+QRCODE;
            } else {
                alert("タスクのQRコードを認識してください");
            }
    }

    // 加速度が変化
    function devicemotionHandler(event) {
        if (isCatch == true) {
            if (isMotion) return;



            // 加速度
            // X軸
            var x = event.acceleration.x;
            // Y軸
            var y = event.acceleration.y;
            // Z軸
            var z = event.acceleration.z;

            $arrow.stop();

            var l = 7;
            if (x > l) { // 右
                alert("migi");
                right();
            } else if (x < -l) { // 左
                alert("hidari");
                left();
            } else if (y > l) { // 上
                //alert("ue");
            } else if (y < -l) { // 下
                //alert("sita");
            } else return;

            isMotion = true;

            $arrow.delay(500).transition({ x: 0, y: 0 }, 300, "easeOutCubic", function() {
                isMotion = false
            });
        }
    }

    function resizeHandler(event) {
        stageW = $window.width();
        stageH = $window.height();
    }
})();



    function right() {
        var qrid = document.getElementById("display_data").textContent;
        const task = project.tasks.find(x => String(x.id) === qrid);
        const currentStage = project.stages.find(x => x.id === task.stageId);
        const stageNames = ['issue', 'backlog', 'todo', 'doing', 'review', 'done'];
        const currentPos = stageNames.indexOf(currentStage.name);
        const afterPos = currentPos + 1;

        var username = document.getElementById("userlist").value;
        const selectUser = project.users.find(x => x.username === username);

        if (afterPos > stageNames.length) {
            // 次のステージには行けない
        }
        const afterStage = project.stages.find(x => x.name === stageNames[afterPos]);

        let afterUserId;
        if (afterStage.assigned) {
            if (task.userId == null){
                afterUserId = selectUser.id;
            }
            else{
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
        var qrid = document.getElementById("display_data").textContent;
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
            return null; }
        const qs = search.slice(1).split('&').map(q => q.split('='));
        const q = qs.find(x => x.length && x[0] === 'projectId');
        return q && q.length > 1 && q[1] || null;
    }
