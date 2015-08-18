/*
 * This module stores all database schemas.
 * 
 * Avaliable props:{
 *      type: JavaSctipt datatype
 *      size: max field length
 *      sequence: bool if is "auto_increment"
 *      primary: bool if key is primary
 *      pattern: RegExp (checking in DB module)
 *      encrypted: bool
 *      'required': bool
 * }
 */
var schemas = {
    'users':{
        'id':{'type':'int','primary':true,'sequence':true},
        'login':{'type':'string','size':32,'pattern':/^[a-zA-Z][a-zA-Z0-9-_\.]{2,32}$/,'required':true,'unique':true},		
        'passwd':{'type':'string','size':64,'encrypted':true, 'required':true},			
        'name':{'type':'string','size':100, 'pattern':/^[A-Za-zА-Яа-я\s]{,100}$/},		
        'email':{'type':'string','size':255, 'pattern':/^[-\w.]+@({A-z0-9][-A-z0-9]+\.)+[A-z]{2,15}$/,'unique':true,'required':true},				
        'role':{'type':'int','required':true},			
        'position':{'type':'string','size':100},			
        'avatar_url':{'type':'string','size':200},			
        'about':{'type':'string','size':255},			
        'creation_time':{'type':'timestamp','size':26}
    },
    'auth_tokens':{
        'id':{'type':'int','primary':true},
        'uid':{'type':'int'},
        'token':{'type':'string','size':64},
        'creation_time':{'type':'timestamp','size':26},
        'expiration_time':{'type':'timestamp','size':26}
    },
    'contacts':{
        'user_id':{'type':'int','primary':true},
        'contact_id':{'type':'int','primary':true}
    },
    'events':{
        'id':{'type':'int','primary':true},
        'title':{'type':'string','size':100},
        'description':{'type':'string'},
        'date':{'type':'timestamp','size':26},
        'place':{'type':'string','size':100},
        'plan':{'type':'string'},
        'creation_time':{'type':'timestamp','size':26},
        'author_id':{'type':'int','primary':true},
        'access':{'type':'int'}
    },
    'events_users':{
        'event_id':{'type':'int','primary':true},
        'user_id':{'type':'int','primary':true},
        'status':{'type':'int'}
    },
    'events_documents':{
        'event_id':{'type':'int','primary':true},
        'document_id':{'type':'int','primary':true}
    },
    'news':{
        'id':{'type':'int','primary':true},
        'title':{'type':'string','size':100},
        'content':{'type':'string'},
        'tags':{'type':'string','size':255},
        'author_id':{'type':'int', 'primary':true},
        'access':{'type':'int'},
        'creation_time':{'type':'timestamp','size':26},
        'preview_url':{'type':'string','size':255}
    },
    'documents':{
        'id':{'type':'int','primary':true},
        'parent_id':{'type':'int', 'primary':true},
        'doctype':{'type':'string','size':50},
        'original_name':{'type':'string','size':255},
        'title':{'type':'string','size':100},
        'desc':{'type':'string','size':255},
        'owner_id':{'type':'int', 'primary':true},
        'access':{'type':'int'},
        'update_time':{'type':'timestamp','size':26},
        'tags':{'type':'string','size':255},
        'hash':{'type':'string','size':40},
    }
};
module.exports = schemas;