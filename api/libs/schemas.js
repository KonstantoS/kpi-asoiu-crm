/*
 * This module stores all database schemas.
 * Avaliable props:
 * type: JavaSctipt datatype
 * size: max field length
 * primary: bool if key is primary
 * pattern: RegExp (checking in DB module)
 * encrypted: bool 
 */
var schemas = {
    'users':{
        'id':{'type':'int','primary':true},
        'login':{'type':'string','size':32,'pattern':/^[a-zA-Z][a-zA-Z0-9-_\.]{2,32}$/,required:true},		
        'passwd':{'type':'string','size':64,'encrypted':true, required:true},			
        'name':{'type':'string','size':100, 'pattern':/^[A-Za-zА-Яа-я\s]{,100}$/},		
        'email':{'type':'string','size':255, 'pattern':/^[-\w.]+@({A-z0-9][-A-z0-9]+\.)+[A-z]{2,15}$/,required:true},				
        'role':{'type':'int',required:true},			
        'position':{'type':'string','size':100},			
        'avatar_url':{'type':'string','size':200},			
        'about':{'type':'string','size':255},			
        'creation_time':{'type':'timestamp','size':26}
    },
    'auth_tokens':{
        'uid':{'type':'int'},
        'token':{'type':'string','size':64},
        'creation_time':{'type':'timestamp','size':26},
        'expiration_time':{'type':'timestamp','size':26}
    }
};
module.exports = schemas;