'use strict';
require('babel-polyfill');
require('../../scss/kanban.scss');
const _ = require('lodash');
const Project = require('../models/project');
const Socket = require('../models/socket');
const Util = require('../modules/util');
const Kanban = require('../viewmodels/kanban');

const {projectId} = Util.parseURLQuery();

let project, socket;

const $title = $('#title');
const $description = $('#description');
const $stage = $('#stage');
const $cost = $('#cost');
const $labelList = $('#labellist');

const $createTask = $('#create-task');

Project.fetch(projectId)
    .then(_project => {
        project = _project;
        socket = new Socket();
        new Kanban(project, socket);

        project.labels.forEach(({name}) => {
            const $input = $('<input type="checkbox" class="label-item" />').val(name);
            const $label = $('<label>').text(name);
            $labelList.append($input).append($label);
        });

        project.stages.forEach(({name}, i) => {
            const $option = $(`<option value="${name}">${name}</option>`);
            if (!i) { $option.prop('selected', true); }
            $stage.append($option);
        });

        project.costs.forEach(({name}, i) => {
            const $option = $(`<option value="${name}">${name}</option>`);
            if (!i) { $option.prop('selected', true); }
            $cost.append($option);
        });

        $createTask.on('click', onClickCreateButton);
    })
    .catch(err => console.error(err));


function onClickCreateButton () {
    const title = $title.val();
    const description = $description.val();
    const stageName = $stage.val();
    const costName = $cost.val();

    const stage = project.stages.find(x => x.name === stageName);
    const cost = project.costs.find(x => x.name === costName);
    const labels = _.map($('.label-item:checked'), ele => {
        const labelName = $(ele).val();
        return project.labels.find(x => x.name === labelName);
    });

    socket.emit('createTask', {
        title: title,
        body: description,
        stageId: stage.id,
        costId: cost.id,
        labelIds: labels.map(x => x.id)
    });
}
