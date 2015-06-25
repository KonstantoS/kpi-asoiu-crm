var encryption = require('sha256');
var db = require('../libs/database');
var config = require('../libs/config');
/*
 * See DB schema at: libs/schemas.js
 */
User = function(data){
    for(var field in data){
        if(db.schema.users.hasOwnProperty(field)){
            if(!this.set(field,data[field]))
                this[field] = null;
        }
    }
};
User.prototype = {
    fill: function(fields){
        for(var field in fields){
            if(db.schema.users.hasOwnProperty(field))
                if(this.set(field, fields[field]) !== true){
                    eraseUser(this);
                    return false;
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
        if(this.id === null){
            this.findUsers({'login':this.login},{},function(res,err){
                if(typeof err === 'object')
                    if(err.status === 404)
                        db.insert('users',data,callback);
                else
                    return callback({},{'status':400,'desc':'User wasn\'t created. Login isn\'t avaliable.'});
            });
        }
        else
            db.update('users',data,[['users','id'],'match',this.id],callback);
    },
    findUsers: function(usersProp, params, callback, single){
        single = (single !== undefined) ? single : false;
        var queryParams = {};
        
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
        
        db.select('all',['users'],queryParams,function(result,err){
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
        this.findUsers(userParams, {}, function(res,err){
            if(typeof err !== 'object')
                _user.fill(res[0]);
            callback(_user,err);
        });
    },
    byId: function(uid,callback){
        this.getInfo({'id':uid},callback);
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