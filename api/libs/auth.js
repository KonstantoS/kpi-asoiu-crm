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
        },function(err, res){
            if(err.hasOwnProperty('status'))
                return callback(err);
            else
                return callback({},res.rows[0]);
        }, true);
    }
    function APItoken(){
        
    }
    public.checkAuth = function(req,res,next){
        if(req.headers.hasOwnProperty('authorization') === false)
            return res.json({'status':403,'desc':'Access denided!'});
        
        var params = req.headers.authorization.split(':');
        var uid = params[0];
        var token = params[1];
        db.select({
            'users':['id','login','name','role','position','avatar_url'],
            'auth_tokens':'all'
        },['auth_tokens','users'],
        {'where':[[['auth_tokens','uid'],'=',uid],'and',[['auth_tokens','token'],'=',token],'and',[['users','id'],'=',uid]]},
        function(err,result){
            if(err.hasOwnProperty('status')){
                return res.json(err);
            }
            else if(result.rowCount > 0){
                if(new Date() < new Date(result.rows[0].expiration_time)){
                    /*req.currentUser = {
                        'id':result.rows[0].id,
                        'login':result.rows[0].login,
                        'role':result.rows[0].role
                    };*/
                    req.currentUser = new User(result.rows[0]);
                    
                    return next();
                }
                else{
                    db.delete('auth_tokens',[[['auth_tokens','uid'],'=',uid],'and',[['auth_tokens','token'],'=',token]],function(err,result){
                        if(err.hasOwnProperty('status') === false)
                            return res.json({'status':401,'desc':'Your token using period expired. Please relogin.'});
                    });
                }
            }
            else{
                return res.json({'status':401,'desc':'Your token using period expired. Please login.'});
            }
        });
    };
    public.signIn = function(req,res,next){
        var user = new User();
        user.verifyUser(req.body.login,req.body.passwd, function(err,result){
            if(err.hasOwnProperty('status')){
                res.json(err);
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
        db.delete('auth_tokens',[[['auth_tokens','uid'],'=',uid],'and',[['auth_tokens','token'],'!=',currToken]],function(err,result){
            if(err.hasOwnProperty('status') === false)
                return res.json({'status':200,'desc':'All sessions where destroyed!'});
        });
    };
    return public;
})();

module.exports = Auth;
