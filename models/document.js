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

//TODO: .byPath, .zipSelected, .notInUse methods

Document.prototype._import_({
    userAccess: function(user, callback){
        var self = this;

        if(this.id === 0) return callback(7); //User trying to operate in own "root"

        db.query('SELECT \
                    (SELECT access \
                        FROM document_users \
                        WHERE (doc_id = '+self.id+') AND (user_id = '+user.id+')\
                    ) AS personal_access, \
                    (SELECT access \
                        FROM document_groups LEFT JOIN user_groups ON user_groups.group_id=document_groups.group_id \
                        WHERE (document_groups.doc_id = '+self.id+') AND (user_groups.user_id = '+user.id+')\
                    ) AS group_access, \
                    access AS global_access, owner_id AS owner \
                        FROM documents \
                    WHERE (id = '+self.id+')',
            function(err,result){
                if(err !== null)
                    return callback(0);
                if(result.rowCount===0)
                    return callback(0);

                // If user is owner => he can "rwm"
                if(user.isOwner(result.rows[0].owner)) return callback(7);

                result.rows[0].personal_access = result.rows[0].personal_access === 'NULL' ? 0 : result.rows[0].personal_access;
                result.rows[0].group_access = result.rows[0].group_access === 'NULL' ? 0 : result.rows[0].group_access;
                result.rows[0].global_access = (result.rows[0].global_access & user.role) ? 1 : 0;

                return callback(Math.max(result.rows[0].personal_access, result.rows[0].group_access, result.rows[0].global_access)); //Returns the "biggest access"
        });
    },
    pathByHash: function(hash){
        var result='';
        for(var i=0;i<hash.length;i+=2){
            result += hash.substr(i,2);
            result += (i<hash.length-2) ? '/' : '';
        }
        return result;
    },
    alreadyExists: function(callback){
        var self = this;

        this.find({
            'parent_id':self.parent_id,
            'original_name':self.original_name
        },{},callback,true);
    },
    isFolder: function(){
        return this.doctype === '_DIR_' || this.id === 0;
    },
    getContent: function(callback){
        var self = this;

        db.select('all',[this._schema],{
            'where': (function(){
                var result = [[[self._schema,'parent_id'],'=',self['id']]];
                if(self.id === 0) result.push('and',[[self._schema,'owner_id'],'=',self['owner_id']]);
                return result;
            })()
        },function(err,result){
            if(err !== null)
                return callback(err);
            if(result.rowCount===0)
                return callback({'status':200,'desc':'Empty dir'});

            var objectsData = [];
            result.rows.forEach(function(usr_data){
                var object = new self.constructor(usr_data);
                objectsData.push(object.data());
            });
            return callback(null,objectsData);
        });
    },
    inUse: function(callback){
        var self = this;
        this.getInfo({'hash':self.hash},callback);
    }
});

module.exports = Document;