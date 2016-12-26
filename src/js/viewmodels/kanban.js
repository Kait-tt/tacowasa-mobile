'use strict';

class Kanban {
    constructor (project, socket) {
        this.project = project;
        this.socket = socket;
        socket.join(project.id);
        this.socketInit();
    }

    socketInit () {
        const {socket, project} = this;

        socket.on('createTask', ({ task }) => project.tasks.push(task));

        socket.on('archiveTask', ({ task }) => {
            project.tasks.find(x => x.id === task.id).stageId = task.stageId;
        });

        socket.on('updateTaskStatus', ({ task: _task }) => {
            const task = project.tasks.find(x => x.id === _task.id);
            task.stageId = _task.stageId;
            task.userId = _task.userId;
        });

        socket.on('updateTaskStatusAndOrder', ({ task: _task }) => {
            const task = project.tasks.find(x => x.id === _task.id);
            task.stageId = _task.stageId;
            task.userId = _task.userId;
        });

        socket.on('updateTaskContent', ({ task: _task }) => {
            const task = project.tasks.find(x => x.id === _task.id);
            task.title = _task.title;
            task.body = _task.body;
            task.costId = _task.costId;
        });

        socket.on('updateTaskWorkingState', ({ task, isWorking }) => {
            project.tasks.find(x => x.id === task.id).isWorking = isWorking;
        });

        socket.on('attachLabel', ({ task, label }) => {
            project.tasks.find(x => x.id === task.id).labels = task.labels;
        });

        socket.on('detachLabel', ({ task, label }) => {
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
}

module.exports = Kanban;
