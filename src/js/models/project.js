'use strict';

class Project {
    static get columnKeys () {
        return [
            'id',
            'name',
            'enabled',
            'defaultWipLimit',
            'users',
            'stages',
            'costs',
            'tasks',
            'labels',
            'accessLevels',
            'createUser',
            'defaultStage',
            'defaultAccessLevel',
            'defaultCost',
            'createdAt',
            'updatedAt'
        ];
    }

    constructor (opts) {
        this.opts = opts;
        Project.columnKeys.forEach(key => { this[key] = opts[key]; });
    }

    static fetch (id) {
        return Promise.resolve($.ajax({
            url: `/api/projects/${id}`,
            type: 'get',
            dataType: 'json'
        })).then(({project}) => {
            return new Project(project);
        });
    }

}

module.exports = Project;
