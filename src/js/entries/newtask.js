'use strict';
require('babel-polyfill');
require('../../scss/kanban.scss');
const _ = require('lodash');
const Project = require('../models/project');
const Socket = require('../models/socket');
const Util = require('../modules/util');
const Kanban = require('../viewmodels/kanban');

const {projectId} = Util.parseURLQuery();


let project, socket, kanban;

        console.log(1);
Project.fetch(projectId)
    .then(_project => {
        project = _project;
        socket = new Socket();
        kanban = new Kanban(project, socket);


        var label = [];

        for (var i in project.labels){
            label.push(project.labels[i].name);
        }
        for (var count = 0; count < label.length; count++) {
            var plist = $('<input type="checkbox" name="listname" />').html(label[count]).val(label[count]);
            var qlist = $('<label>').html(label[count]);
            $("#labellist").append(plist).append(qlist);
        }

        attachSamples();
    })
    .catch(err => console.error(err));


function attachSamples () {

    document.getElementById('create-task').addEventListener('click', () => {

    var taskname = document.getElementById("taskname").value;
    var description = document.getElementById("description").value;
    var stage = document.getElementById("stage").value;
    var cost = document.getElementById("cost").value;



    const stage2 = project.stages.find(x => x.name === stage);
    const cost2 = project.costs.find(x => x.name === cost);




    var labellist2 = [];
    $('[name="listname"]:checked').each(function(){
        labellist2.push(project.labels.find(x => x.name === $(this).val()));
        // labellist2.push($(this).val());
    });

    console.log(labellist2);
    // labellist2.push(project.labels.find(x => x.name === labelname));

    const label2 = labellist2.map(x => x.id);


    socket.emit('createTask', {
                title: taskname,
                body: description,
                stageId: stage2.id,
                costId: cost2.id,
                labelIds: label2
        });

}, false);

}
