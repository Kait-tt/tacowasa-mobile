'use strict';
require('babel-polyfill');
require('../../scss/kanban.scss');
const _ = require('lodash');
const Util = require('../modules/util');
const Project = require('../models/project');
const Socket = require('../models/socket');
const Kanban = require('../viewmodels/kanban');

const {projectId} = Util.parseURLQuery();

let project, socket, kanban;

Project.fetch(projectId)
    .then(_project => {
        project = _project;
        socket = new Socket();
        kanban = new Kanban(project, socket);

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
            .filter(x => _.includes(['issue', 'backlog'], project.stages.find(y => y.id === x.stageId).name))
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

        socket.emit('updateTaskContent', {
            taskId: task.id,
            updateParams: {
                title: task.title + ' updated',
                body: task.body + ' updated',
                costId: _.sample(project.costs).id
            }
        });
    });
}
