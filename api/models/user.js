var sha256 = require('sha256');
var db = require('./libs/database');
/*
 * See DB schema at: libs/schemas.js
 */
User = function(data){
    this.id = null;
    if(typeof data === 'object'){
        for(key in data){
            this.key = data[key];
        }
    }
};
User.prototype = {
     
};



module.exports = User;