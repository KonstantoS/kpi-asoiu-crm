/*
 * This schema stores other modules permissions
 * key - module name
 * rwm
 */
var ADMIN = '1000';
var TEACHER = '0100';
var WORKER = '0010';
var STUDENT = '0001';

var permissions = {
    'users':STUDENT,
    'events':STUDENT,
    'tasks':WORKER,
    'news':STUDENT,
    'documents':STUDENT
};
module.exports = schemas;