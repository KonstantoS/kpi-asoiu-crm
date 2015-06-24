var pg = require('pg');
var config = require('../libs/config');
var schemas = require('../libs/schemas');
var DB = (function(){
    var conString = process.env.DATABASE_URL || 'postgres://'+config.get('db:user')+':'+config.get('db:pass')+'@'+config.get('db:host')+'/'+config.get('db:name');
    
    function sendQuery(queryString, _return){   
        pg.connect(conString, function(err, client, done){
          if (err) {
            return console.error('Error fetching client from pool:', err);
          }
          client.query(queryString, function(err, result) {
            done();
            if (err) {
              return console.error('Error running query:', err);
            }
            _return(result);
          });
        });
    }
    function checkField(item){
        var table = item[0][0];
        var field = item[0][1];
        var operator = item[1];
        var value = item[2];
        switch (operator) {
            case '<':
            case 'less':
            case '>':
            case 'more':
            case '=':
            case 'equal':
            case '!=':
            case 'between':
                if(DB.schema[table][field][0] === 'int' && (isNaN(parseInt(value)) || (item[3]!==undefined && isNaN(parseInt(item[3])))))
                    return false;
                else if(DB.schema[table][field][0] === 'string' && (typeof value !== 'string' || value.length > DB.schema[table][field][1]))
                    return false;
                break;
            case 'like':
                if(DB.schema[table][field][0] !== 'string' || typeof value !== 'string')
                    return false;
                break;
        }
        return true;
    }
    function wherePart(where){
        var Where = ' WHERE ';
        where.forEach(function(item){
            if(typeof item === 'object'){
                var table = item[0][0];
                var field = item[0][1];
                var operator = item[1];
                var condition = '';
                switch (operator) {
                    case '<':
                    case 'less':
                        condition = table+'.'+field + ' < ' + item[2] + '';
                        break;
                    case '>':
                    case 'more':
                        condition = table+'.'+field + ' > ' + item[2] + '';
                        break;
                    case 'between':
                        condition = table+'.'+field + ' between ' + item[2] + ' and ' + item[3];
                        break;
                    case '=':
                    case 'equal':
                        condition = table+'.'+field + ' = ' + item[2] + '';
                        break;
                    case 'like':
                        condition = table+'.'+field + ' ILIKE \'%' + item[2] + '%\' ';
                        break;
                    case '!=':
                    case 'not equal':
                        condition = table+'.'+field + ' != ' + item[2] + '';
                        break;
                }
                Where += '('+condition+')';
            }
            else if(typeof item === 'string' && (item.toLowerCase()==='and' || item.toLowerCase()==='or')){
                Where += (' '+item.toUpperCase()+' ');
            }
        });
        return Where;
    }
    
    var public = {};
    /*
     * Database tables schemas and field patterns
     */
    public.schema = schemas; 
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
                        fld = table+'.'+fields[table][i];
                    else
                        fld = table+'.'+'*';
                    flds.push(fld);
                }
                Selection += flds.join(', ');
            }
        Selection += ' FROM ';
        from.forEach(function(val,i,from){
            from[i] = val;
        });
        Selection += from.join(', ');
        if(params.hasOwnProperty('where')){
            Selection += wherePart(params.where);
        }
        if(params.hasOwnProperty('order')){
            Selection += ' ORDER BY ';
            var ordered = [];
            params.order.by.forEach(function(item){
                ordered.push(item[0]+'.'+item[1]);
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
        
        return sendQuery(Selection,callback);
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
        for(var key in data){
            if(false === data[key].match(DB.schema[table][key][3]))
                return callback(400);
            vals.push('\''+data[key]+'\'');
        }
        Insert += (vals.join(', ')+');');
        return sendQuery(Insert,callback);
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
        for(var key in data){
            vals.push(key+'=\''+data[key]+'\'');
        }
        Update += (vals.join(', '));
        Update += wherePart(where)+';';
        
        return sendQuery(Update,callback);
    };
    /*
     * Method creates DELETE query for deletiong from table
     * 
     * @param string table
     * @param array what |ex [[[table,field],equals,value],'and',...]
     * @param function callback(statuscode)
     */
    public.delete = function(table, what, callback){
        var Delete = 'DELETE FROM '+table+wherePart(what)+';';
        
        return sendQuery(Delete, callback);
    };
    return public;
})();

module.exports = DB;
