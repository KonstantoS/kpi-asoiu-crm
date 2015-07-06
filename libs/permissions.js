/*
 * This schema stores other modules permissions
 * key - module name
 * rwm
 */
var ADMIN_ACCESS = parseInt('1000',2);
var TEACHER_ACCESS = parseInt('1100',2);
var WORKER_ACCESS = parseInt('1110',2);
var STUDENT_ACCESS = parseInt('1111',2);

var permissions = {
    'users':{
        'browse':STUDENT_ACCESS,
        'create':ADMIN_ACCESS,
        'modifyAll':ADMIN_ACCESS,
        'changeRole':ADMIN_ACCESS
    },
    'events':{
        'browse':STUDENT_ACCESS,
        'create':STUDENT_ACCESS
    },
    'tasks':{
        'browse':WORKER_ACCESS,
        'create':WORKER_ACCESS
    },
    'news':{
        'browse':STUDENT_ACCESS,
        'create':STUDENT_ACCESS,
        'modifyAll':ADMIN_ACCESS
    },
    'documents':{
        'browsee':STUDENT_ACCESS,
        'create':STUDENT_ACCESS
    }
};
module.exports = permissions;