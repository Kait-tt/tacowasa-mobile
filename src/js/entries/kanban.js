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

        attachSamples();
    })
    .catch(err => console.error(err));

function attachSamples () {
    // create task sample
    document.getElementById('create-task').addEventListener('click', () => {
        socket.emit('createTask', {
            title: 'sample title',
            body: 'sample body',
            stageId: project.stages.find(x => x.name === 'backlog').id,
            costId: project.costs.find(x => x.name === 'medium').id,
            labelIds: _.sampleSize(project.labels, 2).map(x => x.id)
        });
    }, false);

    // update task status and order sample
    document.getElementById('update-task-status-and-order').addEventListener('click', () => {
        const task = _.chain(project.tasks)
            .filter(x => _.includes(['issue', 'backlog'], project.stages.find(y => y.id === x.stageId)))
            .sample()
            .value();
        const todo = project.stages.find(x => x.name === 'todo');
        const user = _.sample(project.users);
        const beforeTask = _.chain(project.tasks)
            .filter(x => x.stageId === todo.id)
            .filter(x => x.userId === user.id)
            .sample();

        socket.emit('updateTaskStatusAndOrder', {
            taskId: task.id,
            beforeTaskId: beforeTask && beforeTask.id || null,
            updateParams: {
                stageId: todo.id,
                userId: user.id
            }
        });
    });

    // update task content sample
    document.getElementById('update-task-content').addEventListener('click', () => {
        const task = _.sample(project.tasks);

        socket.emit('updateTaskStatusAndOrder', {
            title: task.title + ' updated',
            body: task.body + ' updated',
            costId: _.sample(project.costs).id
        });
    });
}

function socketInit () {
    socket.on('createTask', ({task}) => project.tasks.push(task));

    socket.on('archiveTask', ({task}) => {
        project.tasks.find(x => x.id === task.id).stageId = task.stageId;
    });

    socket.on('updateTaskStatus', ({_task}) => {
        const task = project.tasks.find(x => x.id === _task.id);
        task.stageId = _task.stageId;
        task.userId = _task.userId;
    });

    socket.on('updateTaskStatusAndOrder', ({_task}) => {
        const task = project.tasks.find(x => x.id === _task.id);
        task.stageId = _task.stageId;
        task.userId = _task.userId;
    });

    socket.on('updateTaskContent', ({_task}) => {
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
