'use strict';
require('babel-polyfill');
require('../../scss/edit.scss');
require('bootstrap');
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
            const $input = $('<input type="checkbox" class="label-item" />').val(name);
            const $label = $('<label>').text(name);
            if (labelIds.includes(id)) { $input.prop('checked', true); }
            $labelList.append($input).append($label);
        });

        $updateTask.on('click', onClickUpdateButton);
    })
    .catch(err => console.error(err));


function onClickUpdateButton () {
    const title = $title.val();
    const description = $description.val();
    const costName = $cost.val();

    const cost = project.costs.find(x => x.name === costName);
    const labelIds = _.map($('.label-item:checked'), ele => {
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
}
