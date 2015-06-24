var schemas = {
    'users':{
        'id':['int'],
        'login':['string',32,/^[a-zA-Z][a-zA-Z0-9-_\.]{2,32}$/],		
        'passwd':['string',64,/.*/],			
        'fname':['string',100, /^[A-Za-zА-Яа-я\s]$/],		
        'email':['string',255, /^[-\w.]+@([A-z0-9][-A-z0-9]+\.)+[A-z]{2,4}$/],				
        'role':['int'],			
        'position':['string',100, /[A-Za-zА-Яа-я\s\W]{,100}/],			
        'avatar_url':['string',200],			
        'about':['string',255,/.*/],			
        'creation_time':['timestamp',26,'now()']
    }
};
module.exports = schemas;