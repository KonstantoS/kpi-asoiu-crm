var Model = require('./model');
var db = require('../libs/database');
var config = require('../libs/config');
var perm = require('../libs/permissions');

/*
 * See DB schema at: libs/schemas.js
 */
function Event(data){
    this._object = 'Event';
    this._schema = 'events';
    Model.apply(this,arguments);
};
Event.prototype = Object.create(Model.prototype);
Event.prototype.constructor = Event;

Event.prototype._import_({
    
});

module.exports = Event;