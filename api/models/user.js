var encryption = require('sha256');
var db = require('../libs/database');
var config = require('../libs/config');
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
    fill: function(fields){
        for(var field in fields){
            if(db.schema.users.hasOwnProperty(field))
                if(db.schema.users[field].primary !== true)
                    if(this.set(field, fields[field]) !== true){
                        eraseUser(this);
                        return {'status':400,'desc':'User wasn\'t created. Wrong data in field: '+field};
                    }
        }
        return true;
    },
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
    save: function(callback){
        var data = {};
        for(var key in this){
            if(this.hasOwnProperty(key)){
                if(this[key] !== null)
                    data[key] = this[key];
            }
        }
        if(false === this.hasOwnProperty('id')){
            this.findUsers({'login':this.login},{},function(res,err){
                if(typeof err === 'object')
                    if(err.status === 404)
                        db.insert('users',data,function(result,err){
                            if(typeof err !== 'object')
                                return callback({'status':200,'desc':'User was created.'});
                            else
                                return callback(err);
                        });
                else
                    return callback({'status':400,'desc':'User wasn\'t created. Login isn\'t avaliable.'});
            });
        }
        else if(false === isNaN(parseInt(this.id)))
            db.update('users',data,[[['users','id'],'=',this.id]],function(result,err){
                if(typeof err !== 'object')
                    return callback({'status':201,'desc':'User was updated.'});
                else
                    return callback(err);
            });
        else
            return callback({'status':400,'desc':'Bad request. User id is not integer value'});
    },
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
                    if(db.schema.check([['users',field],'match',usersProp[field]]))
                        whereArr.push([['users',field],'=',usersProp[field]]);
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
        
        db.select(fields,['users'],queryParams,function(result,err){
            if(typeof err === 'object')
                return callback({},err);
            if(result.rowCount===0)
                return callback({},{'status':404,'desc':'User not found.'});
            var usersData = [];
            result.rows.forEach(function(usr_data){
                var user = new User(usr_data);
                usersData.push(user);
            });
            return callback(usersData);
        });
    },
    getInfo: function(userParams,callback){
        var _user = this;
        this.findUsers(userParams, {
            'fields':['id','login','name','email','role','position','about','avatar_url']
        }, function(res,err){
            if(typeof err !== 'object')
                _user = new User(res[0]);
            return callback(_user,err);
        });
    },
    byId: function(uid,callback){
        this.getInfo({'id':parseInt(uid)},callback);
    },
    byLogin: function(login, callback){
        this.getInfo({'login':login},callback);
    },
    verifyUser: function(login,passwd,callback){       
        this.findUsers({
            'login':login,
            'passwd':passwd
        }, {'fields':['id','login','name','email','role']}, 
        function(res, err){
            if(typeof err === 'object')
                return callback(err);
            else
                return callback(res[0]);
        }); 
    },
    remove: function(callback){
        db.delete(['users'],[[['users','id'],'=',this.id]],function(result,err){
            if(typeof err === 'object')
                return callback(err);
            else
                return callback({'status':200,desc:'User was deleted.'});
        });
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