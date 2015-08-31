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
        if(this.id === 0) {
            return this.find({'parent_id': 0, 'owner_id': user.id}, {}, function (err, result) {
                if(err !== null)
                    return callback(err);

                result.maxAccess = 7;
                return callback(null,result);
            });
        }
        return db.query('SELECT \
                    (SELECT access \
                        FROM document_users \
                        WHERE (doc_id = '+self.id+') AND (user_id = '+user.id+')\
                    ) AS personal_access, \
                    (SELECT access \
                        FROM document_groups LEFT JOIN user_groups ON user_groups.group_id=document_groups.group_id \
                        WHERE (document_groups.doc_id = '+self.id+') AND (user_groups.user_id = '+user.id+')\
                    ) AS group_access, \
                    * \
                        FROM documents \
                    WHERE (id = '+self.id+')',
            function(err,result){
                if(err !== null)
                    return callback({'status':403,'desc':'Access to file denied.'});
                if(result.rowCount===0)
                    return callback({'status':403,'desc':'Access to file denied.'});

                // If user is owner => he can "rwm"
                if(user.isOwner(result.rows[0])) {
                    result.rows[0].maxAccess = 7;
                    return callback(err, result.rows[0]);
                }

                result.rows[0].personal_access = result.rows[0].personal_access === 'NULL' ? 0 : result.rows[0].personal_access;
                result.rows[0].group_access = result.rows[0].group_access === 'NULL' ? 0 : result.rows[0].group_access;
                result.rows[0].global_access = (result.rows[0].access & user.role) ? 1 : 0;

                result.rows[0].maxAccess = Math.max(result.rows[0].personal_access, result.rows[0].group_access, result.rows[0].global_access);

                return callback(null, result.rows[0]);
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
    },
    findAll: function(objProp, params, user, callback){
        objProp = (objProp === 'all') ? {} : objProp;
        var self = this;
        var queryParams = {'where':'','order':'','limit':''};
        var mainQuery = 'SELECT documents.*, GREATEST( coalesce(group_access.access,0),  coalesce(personal.access, 0), 1) as max_access FROM documents \
        LEFT JOIN (SELECT * FROM document_groups INNER JOIN user_groups \
        ON user_groups.group_id=document_groups.group_id \
        WHERE user_groups.user_id = '+user.id+') AS group_access ON (documents.id = group_access.doc_id) \
        LEFT JOIN (SELECT * FROM document_users WHERE user_id = '+user.id+') AS personal \
        ON (personal.doc_id = documents.id) \
        WHERE (( group_access.access > 0 ) OR (personal.access > 0) OR ((documents.access & '+user.role+') > 0) ';


        if(typeof objProp === 'object'){
            var whereArr = [];
            var i=0;
            for(var field in objProp){
                if(db.schema[this._schema].hasOwnProperty(field)){
                    if(i>0)
                        whereArr.push('AND');
                    if(db.schema[this._schema][field].encrypted)
                        objProp[field] = this._encrypt(objProp[field]);
                    if(db.schema.check([[this._schema,field],'match',objProp[field]])){
                        if(db.schema[this._schema][field].type==='string')
                            whereArr.push(this._schema+'.'+field+' ILIKE \'%'+objProp[field]+'%\'');
                        else
                            whereArr.push(this._schema+'.'+field+' = '+objProp[field]);
                        i++;
                    }
                }
            }
            queryParams.where = (whereArr.length>0) ? ' AND '+whereArr.join(' ') : '';
        }

        if(!params.hasOwnProperty('shared'))
            mainQuery += ' OR (documents.owner_id = ' + user.id + ')';
        else
            mainQuery += ') AND (group_access.root_share = true OR personal.root_share = true OR documents.root_share = true';

        mainQuery+=') ';

        if(params.hasOwnProperty('order')){
            queryParams.order += ' ORDER BY ';
            var ordered = [];
            params.order.by.forEach(function(item){
                ordered.push(item[0]+'.'+item[1]);
            });
            queryParams.order += ordered.join(', ')+' ';
            if(params.order.direction.toLowerCase() === 'asc' || params.order.direction.toLowerCase() === 'desc'){
                queryParams.order += params.order.direction.toUpperCase();
            }
            else
                queryParams.order += 'ASC';
        }
        if(params.hasOwnProperty('limit')) {
            if (params.limit.hasOwnProperty('limit'))
                queryParams.limit += ' LIMIT ' + parseInt(params.limit.limit);
            if (params.limit.hasOwnProperty('offset'))
                queryParams.limit += ' OFFSET ' + parseInt(params.limit.offset);
        }
        mainQuery += queryParams.where+queryParams.order+queryParams.limit;

        db.query(mainQuery,function(err,result){
            if(err !== null)
                return callback(err);
            if(result.rowCount===0)
                return callback({'status':404,'desc':self._object+' not found.'});
            var objectsData = [];
            result.rows.forEach(function(data){
                var object = new self.constructor(data);
                objectsData.push(object.data());
            });
            return callback(null,objectsData);
        });
    },
    rmRec:function(callback){

    },
    share:function(type, callback){

    }
});

module.exports = Document;