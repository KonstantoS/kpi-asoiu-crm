var encryption = require('sha256');
var db = require('../libs/database');
var config = require('../libs/config');
var perm = require('../libs/permissions');
/*
 * See DB schema at: libs/schemas.js
 */
User = function(data){
    for(var field in data){
        if(db.schema.users.hasOwnProperty(field)){
            this.set(field,data[field]);
        }
    }
};
User.prototype = {
    /*
     * Setter of User object. 
     * Checks format of data in database schema. If data is wrong erases user. 
     * @param object field | ex. {id:1,name:'John Doe'...} 
     * @returns error object or true 
     */
    fill: function(fields){
        for(var field in fields){
            if(db.schema.users.hasOwnProperty(field))
                if(fields[field] !== null)
                    if(this.set(field, fields[field]) !== true){
                        eraseUser(this);
                        return {'status':400,'desc':'User wasn\'t filled. Wrong data in field: '+field};
                    }
        }
        return true;
    },
    /*
     * Field setter.
     * Checks data if wrong returns false
     * @param string "prop" property name
     * @param var "val" property value
     * @return bool
     * 
     */
    set: function(prop, val){
        if(db.schema.check([['users',prop],'match',val])){
            if(db.schema.users[prop].encrypted)
                val = encrypt(val);
            this[prop] = val;
        }
        else
            return false;
        
        return true;
    },
    /*
     * Saves object in database
     * If user exists - updates his data in database. Otherwise add's his to database.
     * @param callback function(err, result) 
     *  
     */
    save: function(callback){
        var data = {};
        for(var key in this){
            if(this.hasOwnProperty(key)){
                if(this[key] !== null)
                    data[key] = this[key];
            }
        }
        if(false === this.hasOwnProperty('id')){
            this.findUsers({'login':this.login},{},function(err,result){
                if(err !== null)
                    if(err.status === 404)
                        db.insert('users',data,function(err, result){
                            if(err !== null)
                                return callback(err);
                            else
                                return callback({'status':200,'desc':'User was created.'});
                        });
                else
                    return callback({'status':400,'desc':'User wasn\'t created. Login isn\'t avaliable.'});
            });
        }
        else if(false === isNaN(parseInt(this.id)))
            db.update('users',data,[[['users','id'],'=',this.id]],function(err,result){
                console.log(result);
                if(err !== null)
                    return callback(err);
                else if(result.rowCount > 0)
                    return callback({'status':201,'desc':'User was updated.'});
                else
                    return callback({'status':400,'desc':'User wasn\'t modified or not found.'});
            });
        else
            return callback({'status':400,'desc':'Bad request. User id is not integer value'});
    },
    /*
     * Looking up user by his props in database.
     * @param object userProp | ex. 'all' or {id:1,name:...}
     * @param object param | ex. {order:{...},limit:{...},fields:[...]} 
     * @param callback function(err,result)
     * @param bool single - if single user object is needed
     * @return to callback - array of users objects or single user object
     */
    findUsers: function(usersProp, params, callback, single){
        single = (single !== undefined) ? single : false;
        usersProp = (usersProp === 'all') ? {} : usersProp; 
        var queryParams = {};
        var fields;
        
        if(typeof usersProp === 'object'){
            var whereArr = [];
            var i=0;
            for(var field in usersProp){
                if(db.schema.users.hasOwnProperty(field)){
                    if(i>0)
                        whereArr.push('and');
                    if(db.schema.users[field].encrypted)
                        usersProp[field] = encrypt(usersProp[field]);
                    if(db.schema.check([['users',field],'match',usersProp[field]])){
                        if(db.schema.users[field].type==='string' && !single)
                            whereArr.push([['users',field],'like',usersProp[field]]);
                        else
                            whereArr.push([['users',field],'=',usersProp[field]]);
                    }
                    i++;
                }
            }
            queryParams.where = whereArr;
        }
        else
            queryParams.where = usersProp;
        
        if(params.hasOwnProperty('order'))
            queryParams.order = params.order;
        if(params.hasOwnProperty('limit'))
            queryParams.limit = params.limit;
        if(single)
            queryParams.limit = {'amount':1};
        if(params.hasOwnProperty('fields')){
            if(params.fields === 'all')
                fields = params.fields;
            else{
                fields = {};
                fields.users = [];
                params.fields.forEach(function(field){
                    if(db.schema.users.hasOwnProperty(field))
                        fields.users.push(field);
                });
            }
        }
        
        db.select(fields,['users'],queryParams,function(err,result){
            if(err !== null)
                return callback(err);
            if(result.rowCount===0)
                return callback({'status':404,'desc':'User not found.'});
            var usersData = [];
            result.rows.forEach(function(usr_data){
                var user = new User(usr_data);
                usersData.push(user);
            });
            return callback(null,usersData);
        });
    },
    /*
     * Looking up single user by info.
     * Uses User.findUsers method
     * @param userParams
     * @param callback function(err,result)
     * @return to callback - user object
     */
    getInfo: function(userParams,callback){
        var _user = this;
        this.findUsers(userParams, {
            'fields':['id','login','name','email','role','position','about','avatar_url']
        }, function(err, result){
            if(err === null){
                _user.fill(result[0]);
                return callback(_user);
            }
            return callback(err);
        });
    },
    /*
     * Looking up single user by id.
     * Alias for User.getInfo({id:int},callback)
     * @param uid - user id
     * @param callback function(err,result)
     * @return to callback - user object
     */
    byId: function(uid,callback){
        this.getInfo({'id':parseInt(uid)},callback);
    },
    /*
     * Looking up single user by login.
     * Alias for User.getInfo({login:'login'},callback)
     * @param string login
     * @param callback function(err,result)
     * @return to callback - user object
     */
    byLogin: function(login, callback){
        this.getInfo({'login':login},callback);
    },
    /*
     * Looking up single user by login.
     * Alias for User.getInfo({login:'login'},callback)
     * @param string login
     * @param string passwd
     * @param callback function(err,result)
     * @return to callback - user object
     */
    verifyUser: function(login,passwd,callback){       
        this.findUsers({
            'login':login,
            'passwd':passwd
        }, {'fields':['id','login','name','email','role']}, 
        function(err, result){
            if(err !== null)
                return callback(err);
            else
                return callback(null,new User(result[0]));
        },true); 
    },
    /*
     * Removes current user from database.
     * @param callback function(err,result)
     */
    remove: function(callback){
        db.delete(['users'],[[['users','id'],'=',this.id]],function(err,result){
            if(err !== null)
                return callback(err);
            else if(result.rowCount>0)
                return callback({'status':200,desc:'User was deleted.'});
            else
                return callback({'status':400,desc:'User wasn\'t deleted or not found.'});
        });
    },
    /*
     * Checks if user is owner of something.
     * Simple function just for convenience.
     * @param object - object to compare owner with
     * @return bool  
     */
    isOwner: function(object){
        if(this.id === object.owner_id || this.id === object.author_id)
            return true;
        else if(this.login === object.login )
            return true;
        else
            return false;
    },
    hasAccess: function(object){
        
    },
    /*
     * Get's list of users' contacts.
     * @param object userProp | ex. 'all' or {id:1,name:...}
     * @param object param | ex. {order:{...},limit:{...},fields:[...]} 
     * @param callback function(err,result)
     * @return to callback - array of users' contacts objects
     */
    getContacts:function(usersProp, params, callback){
        usersProp = (usersProp === 'all') ? {} : usersProp; 
        
        var queryParams = {
            'where':[[['contacts','user_id'],'=',this.id]],
            'join':{
                'type':'inner',
                'table':'users',
                'on':[[['contacts','contact_id'],'=',['users','id']]]
            },
            'fields':{
                'contacts':'all'
            }
        };
        
        if(typeof usersProp === 'object'){
            var whereArr = [];
            var i=0;
            for(var field in usersProp){
                if(db.schema.users.hasOwnProperty(field)){
                    whereArr.push('and');
                    
                    if(db.schema.users[field].encrypted)
                        usersProp[field] = encrypt(usersProp[field]);
                    if(db.schema.check([['users',field],'match',usersProp[field]])){
                        if(db.schema.users[field].type==='string')
                            whereArr.push([['users',field],'like',usersProp[field]]);
                        else
                            whereArr.push([['users',field],'=',usersProp[field]]);
                    }
                    i++;
                }
            }
            queryParams.where = queryParams.where.concat(whereArr);
        }
        else
            queryParams.where = queryParams.where.concat(userProp);
        
        if(params.hasOwnProperty('order'))
            queryParams.order = params.order;
        if(params.hasOwnProperty('limit'))
            queryParams.limit = params.limit;
        if(params.hasOwnProperty('fields'))
            queryParams.fields.users = params.fields;
        else
            queryParams.fields.users = ['id','login','email','name','role','position','about','avatar_url'];
            
        db.select(queryParams.fields,['contacts'],queryParams,function(err,result){
            if(err !== null)
                return callback(err);
            else if(result.rowCount>0){
                var users = [];
                for(var i=0;i<result.rows.length;i++)
                    users.push(new User(result.rows[i]));
                return callback(null,users);
            }
            else
                return callback({'status':404,desc:'Contacts not found.'});
        });
    },
    /*
     * Adds contact to current user
     * @param int contactID
     * @param callback function(err,result)
     */
    addContact: function(contactId,callback){
        var data = {
            'user_id':this.id,
            'contact_id':parseInt(contactId)
        };
        db.insert('contacts',data,function(err, result){
            if(err !== null)
                return callback(err);
            else
                return callback({'status':200,'desc':'Contact was created.'});
        });
    },
    /*
     * Removes contact by id
     * @param int contactID
     * @param callback function(err,result)
     */
    removeContact: function(contactId,callback){
        db.delete(['contacts'],[[['contacts','contact_id'],'=',parseInt(contactId)]],function(err,result){
            if(err !== null)
                return callback(err);
            else if(result.rowCount>0)
                return callback({'status':200,desc:'Contact was deleted.'});
            else
                return callback({'status':400,desc:'Contact wasn\'t deleted or not found.'});
        });
    },
    /*
     * Detects if user has access to action in module
     * @param module name
     * @param action in module
     * @return bool
     */
    canIn: function(module,action){
        if(perm[module][action] & this.role)
            return true;
        else false;
    }
};
function eraseUser(_this){
    for(var field in db.schema.users){
        _this[field] = null;
    }
}
function encrypt(data){
    return encryption(data+config.get('security:salt'));
}


module.exports = User;