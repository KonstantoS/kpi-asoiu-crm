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
    alreadyExists: function(callback){
        var self = this;

        db.select('all',[this._schema],{
            'where':[
                [[self._schema,'parent_id'],'=',self['parent_id']],[[self._schema,'original_name'],'=',self['original_name']]
            ]
        },function(err,result){
            if((typeof result === 'object' && result.rowCount===0) || (err !== null && err.status === 404))
                callback(null);
            else if(typeof result === 'object'){
                return callback({'status':400,'desc':'Document already exists in folder'});
            }
            else
                return callback(err);
        });
    }
});

module.exports = Document;