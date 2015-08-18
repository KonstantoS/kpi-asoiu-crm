var fse = require('fs-extra');
var Model = require('./model');
var db = require('../libs/database');
var config = require('../libs/config');
var perm = require('../libs/permissions');

/*
 * See DB schema at: libs/schemas.js
 */
var Document = function(data){
    this._object = 'Document';
    this._schema = 'documents';
    Model.apply(this,arguments);
};
Document.prototype = Object.create(Model.prototype);
Document.prototype.constructor = Document;

Document.prototype._import_({
    uniqueInFolder: function(callback){

    }
});

module.exports = Document;