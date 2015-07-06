var perm = require('../libs/permissions');
var RoleManager = (function(){
    var public = {};
    public.roles  = {
        'student':parseInt('0001',2), //int::1
        'worker':parseInt('0010',2), //int::2
        'teacher':parseInt('0100',2), //int::3
        'admin':parseInt('1000',2) //int::4
    };
    public.permissions = perm;
    public.UserCanIn = function(moduleName,action){
        return function(req,res,next){
            if(perm[moduleName][action] & req.currentUser.role)
                next();
            else
                res.json({'status':403,'desc':'You have no access to this module or action'});
        };
    };
    public.isCurrentUser = function(req,res,next){
        if(req.currentUser.id === parseInt(req.params.id))
            next();
        else
            res.json({'status':403,'desc':'Access to user denieded.'});
    };
    return public;
})();
module.exports = RoleManager;