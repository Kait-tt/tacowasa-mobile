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

        /*//add taskid get test
        console.log(project.tasks.select(x => x.labels).filter(function(x, i, self) {
        return self.indexOf(x) === i;
    }));
*/

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


(function () {
  var $arrow;
  var $button;
  var $window;
  var stageW;
  var stageH;

  var isMotion;
  var isCatch;


  $(function () {
    $arrow = $("#arrow");
    $button = $("#button");
    $window = $(window);

    isMotion = false;
    isCatch = false;

    $(window).on("resize", resizeHandler);
    resizeHandler();

    button.addEventListener("click", Catch_release);
    // DeviceMotion Event
    window.addEventListener("devicemotion", devicemotionHandler);
  });

  function Catch_release(event){
    if($("#display_data").text() != "")
      if (isCatch == true){
        isCatch = false;
      alert(0);
      }
      else{
        isCatch = true;
      alert(1);

      }
  }
  // 加速度が変化
  function devicemotionHandler(event) {
    if (isCatch == true){
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
    }
    else if (x < -l) { // 左
      alert("hidari");
      left();
    }
    else if (y > l) { // 上
      alert("ue");
    }
    else if (y < -l) { // 下
      alert("sita");
    }
    else return;

    isMotion = true;

    $arrow.delay(500).transition({x: 0, y: 0}, 300, "easeOutCubic", function () {
      isMotion = false
    });
  }
  }

  function resizeHandler(event) {
    stageW = $window.width();
    stageH = $window.height();
  }
})();


function attachSamples () {

    function right(){
        var qrid = document.getElementById("#display_data").value;

        project.tasks.find(x => x.id === qrid.id).isWorking = isWorking;
        switch(isWorking){
          case "lssue":
            var afterstage = 'backlog';
            break
          case "backlog":
            var afterstage = 'todo';
            break
          case "todo":
            var afterstage = 'doing';
            break
          case "doing":
            var afterstage = 'review';
            break
          case "review":
            var afterstage = 'done';
            break
          case "done":
            var afterstage = 'archive';
            break
        }

        var afterstage2 = project.stages.find(x => x.name === afterstage);

        socket.emit('updateTaskStatusAndOrder', {
            taskId: qrid.id,
            updateParams: {
                stageId: afterstage2.id,
                //userId: user.id
            }
        });
    }

    function left(){
        var qrid = document.getElementById("#display_data").value;

        project.tasks.find(x => x.id === qrid.id).isWorking = isWorking;
        switch(isWorking){
          case "archive":
            var afterstage = 'done';
            break
          case "done":
            var afterstage = 'review';
            break
          case "review":
            var afterstage = 'doing';
            break
          case "doing":
            var afterstage = 'todo';
            break
          case "todo":
            var afterstage = 'backlog';
            break
          case "backlog":
            var afterstage = 'todo';
            break
        }

        var afterstage2 = project.stages.find(x => x.name === afterstage);

        socket.emit('updateTaskStatusAndOrder', {
            taskId: qrid.id,
            updateParams: {
                stageId: afterstage2.id,
                //userId: user.id
            }
        });
    }

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
