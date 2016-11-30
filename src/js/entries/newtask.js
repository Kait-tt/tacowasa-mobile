'use strict';
require('babel-polyfill');
require('../../scss/kanban.scss');
const Project = require('../models/project');
const Socket = require('../models/socket');


let project, socket;

        console.log(1);
Project.fetch(getProjectId())
    .then(_project => {
        project = _project;
        socket = new Socket();
        socket.join(project.id);
        socketInit();

        project.users;
        project.labels;

        /*//add taskid get test
        console.log(project.tasks.select(x => x.labels).filter(function(x, i, self) {
        return self.indexOf(x) === i;
    }));
*/
        console.log(2);

        console.log(stage);
        console.log(stage.value);
        console.log(stage.text);
        console.log(taskname);
        console.log(description);
        /*console.log(project.users.select(x => x.users).filter(function(x, i, self) {
        return self.indexOf(x) === i;
    }));*/


        //user list add
        /*var select = document.getElementById('userlist')

        var selectBox = project.users;

        for ( var i in selectBox ) {
            var option = document.createElement('option');
         
            option.setAttribute('value', i);
            option.innerHTML = selectBox[i];
         
            select.appendChild(option);
        }*/

        attachSamples();
    })
    .catch(err => console.error(err));


function attachSamples () {

    document.getElementById('create-task').addEventListener('click', () => {

    // var qrid = (Math.random()*(999-100)+100);


    var taskname = document.getElementById("taskname").value;
    var description = document.getElementById("description").value;
    var stage = document.getElementById("stage").value;
    var cost = document.getElementById("cost").value;
    /*console.log(project.tasks.select(x => x.labels).filter(function(x, i, self) {
        return self.indexOf(x) === i;
    })); //ラベル取得*/
    console.log(stage);//value

    console.log(taskname);
    console.log(description);

    const stage2 = project.stages.find(x => x.name === stage);
    const cost2 = project.costs.find(x => x.name === cost);

    console.log(stage2);

    socket.emit('createTask', {
            // taskId: qrid,
                title: taskname,
                body: description,
                stageId: stage2.id,
                costId: cost2.id
        });

}, false);

    document.getElementById('create-task-test').addEventListener('click', () => {
        const task = _.chain(project.tasks)
            .filter(x => _.includes(['issue', 'backlog'], project.stages.find(y => y.id === x.stageId).name))
            .sample()
            .value();
        // const task = project.tasks.find(x => x.id === qrId);
        const todo = project.stages.find(x => x.name === 'todo'); //''←の中に
        const user = _.sample(project.users);

        socket.emit('updateTaskStatusAndOrder', {
            taskId: task.id,
            updateParams: {
                stageId: todo.id,
                userId: user.id
            }
        });
    });
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
