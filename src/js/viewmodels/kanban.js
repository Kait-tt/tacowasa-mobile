'use strict';

class Kanban {
    constructor (project, socket) {
        this.project = project;
        this.socket = socket;
        this.socketInit();
    }

    stepStage (taskId, selectUsername, step) {
        const {tasks, stages, users} = this.project;

        const task = tasks.find(x => String(x.id) === String(taskId));
        const currentStage = stages.find(x => x.id === task.stageId);
        const currentPos = stages.indexOf(currentStage);
        const afterPos = currentPos + step;

        const selectUser = users.find(x => x.username === selectUsername);

        if ( afterPos < 0 || afterPos >= stages.length) {
            // 次のステージには行けない
            return;
        }
        const afterStage = stages[afterPos];

        let afterUserId;
        if (afterStage.assigned) {
            if (task.userId == null) {
                afterUserId = selectUser.id;
            } else {
                afterUserId = task.userId;
            }
        } else {
            afterUserId = null;
        }

        this.socket.emit('updateTaskStatus', {
            taskId,
            updateParams: {
                stageId: afterStage.id,
                userId: afterUserId
            }
        });
    }

    stepAssign (taskId, step) {
        const {tasks, stages, users} = this.project;

        const task = tasks.find(x => String(x.id) === String(taskId));
        const currentStage = stages.find(x => x.id === task.stageId);

        if (!currentStage.assigned) { return; } // task is not assigned

        let user = users.find(x => x.id === task.userId);
        const stepKey = step > 0 ? 'nextMemberId' : 'prevMemberId';
        // TODO: check WIP
        while (user) {
            const memberId = user.member[stepKey];
            if (!memberId) { break; }
            user = users.find(x => x.member.memberId === memberId);
        }

        if (!user) { return; }

        socket.emit('updateTaskStatus', {
            taskId: taskId,
            updateParams: {
                stageId: currentStage.id,
                userId: user.id
            }
        });
    }

    socketInit () {
        const {socket, project} = this;

        socket.join(project.id);

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
