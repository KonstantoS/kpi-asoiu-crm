var RoleManager = function(){
    var rolesBits  = {
        'student':'0001', //int::1
        'worker':'0010', //int::2
        'teacher':'0100', //int::4
        'admin':'1000' //int::8
    };
    var public = {};
    public.hasPermission = function(moduleName,action){
        return function(req,res,next){
            
        };
    };
};
module.exports = roles;