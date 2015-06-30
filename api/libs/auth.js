var pg = require('pg');
var config = require('../libs/config');
var userModel = require('../models/user');
var db = require('../libs/database');
var uuid = require('node-uuid');
var Auth = (function(){
    var public = {};
    function createToken(userID, callback){
        var token = uuid.v4();
        db.insert('auth_tokens',{
            'uid':parseInt(userID),
            'token':token,
            'expiration_time':"NOW()+INTERVAL '"+config.get('security:token_age')+"'"
        },function(res, err){
            if(typeof err === 'object')
                return callback(err);
            else
                return callback(res.rows[0]);
        }, true);
    }
    function APItoken(){
        
    }
    public.checkAuth = function(req,res,next){
        var params = req.headers.authorization.split(':');
        var uid = params[0];
        var token = params[1];
        db.select({
            'users':['id','login','name','role','position','avatar_url'],
            'auth_tokens':'all'
        },['auth_tokens','users'],
        {'where':[[['auth_tokens','uid'],'=',uid],'and',[['auth_tokens','token'],'=',token],'and',[['users','id'],'=',uid]]},
        function(rslt,err){
            if(typeof err === 'object'){
                return res.json(err);
            }
            else if(rslt.rowCount > 0){
                if(new Date() < new Date(rslt.rows[0].expiration_time)){
                    req.currentUser = {
                        'id':rslt.rows[0].id,
                        'login':rslt.rows[0].login,
                        'role':rslt.rows[0].role
                    };
                    
                    return next();
                }
                else{
                    db.delete('auth_tokens',[[['auth_tokens','uid'],'=',uid],'and',[['auth_tokens','token'],'=',token]],function(rslt,err){
                        if(typeof err !== 'object')
                            return res.json({'status':401,'desc':'Your token using period expired. Please relogin.'});
                    });
                }
            }
            else{
                return res.json({'status':401,'desc':'Your token using period expired. Please relogin.'});
            }
        });
    };
    public.signIn = function(req,res,next){
        var user = new User();
        user.verifyUser(req.body.login,req.body.passwd, function(result){
            if(result.hasOwnProperty('status')){
                res.json(result);
            }
            else{
                createToken(result.id, function(tokenData){
                    res.cookie('uid', tokenData.uid, { expires: new Date(tokenData.expiration_time)});
                    res.cookie('_auth', tokenData.token, { expires: new Date(tokenData.expiration_time)});
                    res.json({'status':200,'desc':'Successful login!'});
                    next();
                });
            }
        });
    };
    public.closeSessions = function(uid,currToken){
        db.delete('auth_tokens',[[['auth_tokens','uid'],'=',uid],'and',[['auth_tokens','token'],'!=',currToken]],function(rslt,err){
            if(typeof err !== 'object')
                return res.json({'status':200,'desc':'All sessions where destroyed!'});
        });
    };
    return public;
})();

module.exports = Auth;
