var pg = require('pg');
var config = require('../libs/config');

var DB = (function(){
    var conString = process.env.DATABASE_URL || 'postgres://'+config.get('db:user')+':'+config.get('db:pass')+'@'+config.get('db:host')+'/'+config.get('db:name');
    
    function sendQuery(queryString, _return){   
        pg.connect(conString, function(err, client, done){
          if (err) {
            return console.error('Error fetching client from pool:', err);
          }
          client.query(queryString, data, function(err, result) {
            done();
            if (err) {
              return console.error('Error running query:', err);
            }
            _return(result);
          });
        });
    }
    var public = {};
    /*
     * Method creates SELECT SQL by passing data and sends query
     * 
     * @param object fields | ex: {'table':[field,...],..}
     * @param array from | ex: [table,...]
     * @param object params | ex: {'where':[[[table,field],equals,value],'and',...],
     *                             'order':{'by':[[table,field],...],'direction':'asc'},
     *                             'limit':[offset,limit]}
     * @param function callback(result) 
     */
    public.select = function(fields, from, params, callback){
        var Selection = 'SELECT ';
        if(typeof fields === 'string' && (fields === '*' || fields === 'all')){
            Selection += '*';
        }
        else
            for(var table in fields){
                for(var i; i<fields[table].length; i++){
                    var fld ='';
                    if(fields[table][i] !== '*')
                        fld = ''+table+'.'+fields[table][i]+'';
                    else
                        fld = ''+table+'.'+'*';
                    flds.push(fld);
                }
                Selection += flds.join(', ');
            }
        Selection += ' FROM ';
        from.forEach(function(val,i,from){
            from[i] = ''+val+'';
        });
        Selection += from.join(', ');
        if(params.hasOwnProperty('where')){
            Selection += ' WHERE ';
            params.where.forEach(function(item){
                if(typeof item === 'object'){
                    var field = item[0];
                    var operator = item[1];
                    var condition = '';
                    switch (operator) {
                        case '<':
                        case 'less':
                            condition = field + ' < ' + item[2] + '';
                            break;
                        case '>':
                        case 'more':
                            condition = field + ' > ' + item[2] + '';
                            break;
                        case 'between':
                            condition = field + ' between ' + item[2] + ' and ' + item[3];
                            break;
                        case '=':
                        case 'equal':
                            condition = field + ' = ' + item[2] + '';
                            break;
                        case 'like':
                            condition = field + ' like \'%' + item[2] + '%\' ';
                            break;
                        case '!=':
                        case 'not equal':
                            condition = field + ' != ' + item[2] + '';
                            break;
                    }
                    Selection += '('+condition+')';
                }
                else if(typeof item === 'string' && (item.toLowerCase()==='and' || item.toLowerCase()==='or')){
                    Selection += (' '+item.toUpperCase()+' ');
                }
            });
        }
        if(params.hasOwnProperty('order')){
            Selection += ' ORDER BY ';
            var ordered = [];
            params.order.by.forEach(function(item){
                ordered.push(''+item[0]+'.'+item[1]+'');
            });
            Selection += ordered.join(', ')+' ';
            if(params.order.direction.toLowerCase() === 'asc' || params.order.direction.toLowerCase() === 'desc'){
                Selection += params.order.direction.toUpperCase();
            }
            else
                Selection += 'ASC';
        }
        if(params.hasOwnProperty('limit')){
            Selection += (' LIMIT '+params.limit[1]+' OFFSET '+params.limit[0]);
        }
        Selection += ';';
        sendQuery(Selection,callback);
    };
    /*
     * Method creates INSERT query by scheme
     * 
     * @param string table
     * @param object data | ex {'field1':'value', 'field2':'value'....}
     * @param function callback(statuscode) 
     */
    public.insert = function(table, data, callback){
        var Insert = 'INSERT INTO '+table+ ' ('+data.keys().join(', ')+') VALUES (';
        var vals = [];
        for(key in data){
            vals.push('\''+data[key]+'\'');
        }
        Insert += (vals.join(', ')+');');
        sendQuery(Insert,callback);
    };
    /*
     * Method creates UPDATE query
     * 
     * @param string table
     * @param object data | ex {'field1':'value', 'field2':'value'....}
     * @param array where |ex [[[table,field],equals,value],'and',...]
     * @param function callback(statuscode)
     */
    public.update = function(table, data, where, callback){
        var Update = 'UPDATE '+table+' SET ';
        var vals = [];
        for(key in data){
            vals.push(key+'=\''+data[key]+'\'');
        }
        Update += (vals.join(', ')+' WHERE ');
        where.forEach(function(item){
                if(typeof item === 'object'){
                    var field = item[0];
                    var operator = item[1];
                    var condition = '';
                    switch (operator) {
                        case '<':
                        case 'less':
                            condition = field + ' < ' + item[2] + '';
                            break;
                        case '>':
                        case 'more':
                            condition = field + ' > ' + item[2] + '';
                            break;
                        case 'between':
                            condition = field + ' between ' + item[2] + ' and ' + item[3];
                            break;
                        case '=':
                        case 'equal':
                            condition = field + ' = ' + item[2] + '';
                            break;
                        case 'like':
                            condition = field + ' like \'%' + item[2] + '%\' ';
                            break;
                        case '!=':
                        case 'not equal':
                            condition = field + ' != ' + item[2] + '';
                            break;
                    }
                    Update += '('+condition+')';
                }
                else if(typeof item === 'string' && (item.toLowerCase()==='and' || item.toLowerCase()==='or')){
                    Update += (' '+item.toUpperCase()+' ');
                }
            });
        
        Update += ';';
        sendQuery(Update,callback);
    };
    /*
     * Method creates DELETE query for deletiong from table
     * 
     * @param string table
     * @param array what |ex [[[table,field],equals,value],'and',...]
     * @param function callback(statuscode)
     */
    public.delete = function(table, what, callback){
        var Delete = 'DELETE FROM '+table+' WHERE ';
        what.forEach(function(item){
                if(typeof item === 'object'){
                    var field = item[0];
                    var operator = item[1];
                    var condition = '';
                    switch (operator) {
                        case '<':
                        case 'less':
                            condition = field + ' < ' + item[2] + '';
                            break;
                        case '>':
                        case 'more':
                            condition = field + ' > ' + item[2] + '';
                            break;
                        case 'between':
                            condition = field + ' between ' + item[2] + ' and ' + item[3];
                            break;
                        case '=':
                        case 'equal':
                            condition = field + ' = ' + item[2] + '';
                            break;
                        case 'like':
                            condition = field + ' like \'%' + item[2] + '%\' ';
                            break;
                        case '!=':
                        case 'not equal':
                            condition = field + ' != ' + item[2] + '';
                            break;
                    }
                    Delete += '('+condition+')';
                }
                else if(typeof item === 'string' && (item.toLowerCase()==='and' || item.toLowerCase()==='or')){
                    Delete += (' '+item.toUpperCase()+' ');
                }
            });
        
        Delete += ';';
        sendQuery(Delete, callback);
    };
    return public;
})();

module.exports = DB;
