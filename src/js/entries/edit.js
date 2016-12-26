'use strict';
require('babel-polyfill');
require('../../scss/kanban.scss');
const _ = require('lodash');
const Util = require('../modules/util');
const Project = require('../models/project');
const Socket = require('../models/socket');
const Kanban = require('../viewmodels/kanban');

const {projectId, taskId} = Util.parseURLQuery();


let project, socket, kanban;

Project.fetch(projectId)
    .then(_project => {
        project = _project;
        socket = new Socket();
        kanban = new Kanban(project, socket);


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
            taskId,
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
