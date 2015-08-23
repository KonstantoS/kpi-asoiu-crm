var db = require('../libs/database');
var config = require('../libs/config');
var perm = require('../libs/permissions');
var Model = require('./model');
/*
 * See DB schema at: libs/schemas.js
 */

var User = function(data){
    this._object = 'User';
    this._schema = 'users';
    Model.apply(this,arguments);
};
User.prototype = Object.create(Model.prototype);
User.prototype.constructor = User;

User.prototype._import_({
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
        this.find({
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
     * Checks if user is owner of something.
     * Simple function just for convenience.
     * @param object - object to compare owner with
     * @return bool  
     */
    isOwner: function(object){
        console.log(object);
        if(!isNaN(parseInt(object)))
            return this.id === object;
        if(object.owner_id !== undefined || object.author_id !== undefined || object.login !== undefined){
            if(this.id === object.owner_id || this.id === object.author_id)
                return true;
            else if(this.login === object.login )
                return true;
        }
        else
            return false;
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
                        usersProp[field] = this._encrypt(usersProp[field]);
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
                    users.push(new User(result.rows[i]).data());
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
});



module.exports = User;