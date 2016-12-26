'use strict';
require('babel-polyfill');
require('../../scss/kanban.scss');
const _ = require('lodash');
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


        // var label = [];

        // for (var i in project.labels){
        //     label.push(project.labels[i].name);
        // }

        //  $(function() {
        //     for (var count = 0; count < label.length; count++) {
        //         var plist = $('<input type="checkbox" name="listname" />').html(label[count]).val(label[count]);
        //         var qlist = $('<label>').html(label[count]);
        //         $("#labellist").append(plist).append(qlist);
        //     }
        // });
        attachSamples();
    })
    .catch(err => console.error(err));



function attachSamples () {
    document.getElementById('edit-task').addEventListener('click', () => {

    var taskname = document.getElementById("taskname").value;
    var description = document.getElementById("description").value;
    var cost = document.getElementById("cost").value;

    // var labellist2 = [];
    // $('[name="listname"]:checked').each(function(){
    //     labellist2.push(project.labels.find(x => x.name === $(this).val()));
    //     // labellist2.push($(this).val());
    // });

    const cost2 = project.costs.find(x => x.name === cost);
    // const label2 = labellist2.map(x => x.id);

    // var gettask = project.tasks.find(x => x.id === gettaskId().value);

    // const attachLabels = _.difference(label2, gettask.labels());

    socket.emit('updateTaskContent', {
             taskId: gettaskId(),
              updateParams: {
                title: taskname,
                body: description,
                costId: cost2.id
            }
        });

    // attachLabels.forEach(label => {
    //             this.socket.emit('attachLabel', {
    //                 taskId: gettaskId(),
    //                 labelId: label.id()
    //             });
    //         });
}, false);

}



function socketInit () {
    socket.on('createTask', ({task}) => project.tasks.push(task));

    socket.on('archiveTask', ({task}) => {
        project.tasks.find(x => x.id === task.id).stageId = task.stageId;
    });

    socket.on('updateTaskStatus', ({task: _task}) => {
        const task = project.tasks.find(x => x.id === _task.id);
        task.stageId = _task.stageId;
        task.userId = _task.userId;
    });

    socket.on('updateTaskStatusAndOrder', ({task: _task}) => {
        const task = project.tasks.find(x => x.id === _task.id);
        task.stageId = _task.stageId;
        task.userId = _task.userId;
    });

    socket.on('updateTaskContent', ({task: _task}) => {
        const task = project.tasks.find(x => x.id === _task.id);
        task.title = _task.title;
        task.body = _task.body;
        task.costId = _task.costId;
    });

    socket.on('updateTaskWorkingState', ({task, isWorking}) => {
        project.tasks.find(x => x.id === task.id).isWorking = isWorking;
    });

    socket.on('attachLabel', ({task, label}) => {
        project.tasks.find(x => x.id === task.id).labels = task.labels;
    });

    socket.on('detachLabel', ({task, label}) => {
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

function getProjectId () {
    const search = location.search;
    if (!search) { return null; }
    const qs = search.slice(1).split('&').map(q => q.split('='));
    const q = qs.find(x => x.length && x[0] === 'projectId');
    return q && q.length > 1 && q[1] || null;
}

function gettaskId () {
    const search = location.search;
    if (!search) { return null; }
    const qs = search.slice(1).split('&').map(q => q.split('='));
    const q = qs.find(x => x.length && x[0] === 'taskId');
    return q && q.length > 1 && q[1] || null;
}