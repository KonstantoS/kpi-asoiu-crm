var schemas = {
    'users':{
        'id':{'type':'int'},
        'login':{'type':'string','size':32,'pattern':/^[a-zA-Z][a-zA-Z0-9-_\.]{2,32}$/},		
        'passwd':{'type':'string','size':64,'encrypted':true},			
        'fname':{'type':'string','size':100, 'pattern':/^[A-Za-zА-Яа-я\s]{,100}$/},		
        'email':{'type':'string','size':255, 'pattern':/^[-\w.]+@({A-z0-9][-A-z0-9]+\.)+[A-z]{2,15}$/},				
        'role':{'type':'int'},			
        'position':{'type':'string','size':100, 'pattern':/[A-Za-zА-Яа-я\s\W]{,100}/},			
        'avatar_url':{'type':'string','size':200},			
        'about':{'type':'string','size':255},			
        'creation_time':{'type':'timestamp','size':26, 'default':'f::now()'}
    }
};
module.exports = schemas;