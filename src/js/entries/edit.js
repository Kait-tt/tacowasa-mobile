'use strict';
require('babel-polyfill');
require('bootstrap');
require('bootstrap-select');
require('../../scss/edit.scss');
const _ = require('lodash');
const Util = require('../modules/util');
const Project = require('../models/project');
const Socket = require('../models/socket');
const Kanban = require('../viewmodels/kanban');

const qs = Util.parseURLQuery();
const projectId = qs.projectId;
const taskId = Number(qs.taskId);

let project, socket, task;

const $title = $('#title');
const $description = $('#description');
const $cost = $('#cost');
const $labelList = $('#labellist');

const $updateTask = $('#update-task');

const $cancelButton = $('#cancel');

const homeURL = $cancelButton.attr('href') + `?projectId=${projectId}`;
$cancelButton.attr('href', homeURL);

Project.fetch(projectId)
    .then(_project => {
        project = _project;
        socket = new Socket();
        new Kanban(project, socket);

        task = project.tasks.find(x => x.id === taskId);

        $title.val(task.title);
        $description.val(task.body);

        project.costs.forEach(({id, name}) => {
            const $option = $(`<option value="${name}">${name}</option>`);
            if (id === task.costId) { $option.prop('selected', true); }
            $cost.append($option);
        });

        const labelIds = task.labels.map(x => x.id);
        project.labels.forEach(({id, name}) => {
            const $option = $(`<option value="${name}">${name}</option>`);
            if (labelIds.includes(id)) { $option.prop('selected', true); }
            $labelList.append($option);
        });

        $updateTask.on('click', onClickUpdateButton);

        $('select').selectpicker('refresh');
    })
    .catch(err => console.error(err));


function onClickUpdateButton () {
    const title = $title.val();
    const description = $description.val();
    const costName = $cost.val();

    const cost = project.costs.find(x => x.name === costName);
    const labelIds = _.map($labelList.find('option:checked'), ele => {
        const labelName = $(ele).val();
        return project.labels.find(x => x.name === labelName).id;
    });

    socket.emit('updateTaskContent', {
        taskId,
        updateParams: {
            title: title,
            body: description,
            costId: cost.id
        }
    });

    const beforeLabelIds = task.labels.map(x => x.id);
    const attachLabelIds = _.difference(labelIds, beforeLabelIds);
    const detachLabelIds = _.difference(beforeLabelIds, labelIds);
    attachLabelIds.forEach(labelId => {
        socket.emit('attachLabel', {
            taskId: taskId,
            labelId: labelId
        });
    });
    detachLabelIds.forEach(labelId => {
        socket.emit('detachLabel', {
            taskId: taskId,
            labelId: labelId
        });
    });

    location.href = homeURL;
}
