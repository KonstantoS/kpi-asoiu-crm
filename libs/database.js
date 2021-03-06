var pg = require('pg');
var config = require('../libs/config');
var schemas = require('../libs/schemas');
var DB = (function(){
    var conString = process.env.DATABASE_URL || 'postgres://'+config.get('db:user')+':'+config.get('db:pass')+'@'+config.get('db:host')+'/'+config.get('db:name');
    
    function sqlEscape(str){
        return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
            switch (char) {
                case '\\0':
                    return '\\\\0';
                case '\\x08':
                    return '\\\\b';
                case '\\x09':
                    return '\\\\t';
                case '\\x1a':
                    return '\\\\z';
                case '\\n':
                    return '\\\\n';
                case '\\r':
                    return '\\\\r';
                case "'":
                    return "''";
                case '"':
                    return '""';
                case '\\':
                case '\\\\':
                case '%':
                    return '\\'+char;
            }
        });
    }
    function sendQuery(queryString, callback){
        console.log('\x1b[33m%s\x1b[0m: ', queryString);
        pg.connect(conString, function(err, client, done){
          if (err) {
            return callback({'status':500,'desc':'Error fetching client from pool:'+err});
          }
          client.query(queryString, function(err, result) {
            done();
            if (err) {
              return callback({'status':500,'desc':'Error running query:'+err});
            }
            return callback(null, result);
          });
        });
    }
    function wherePart(where){
        var Where = '';
        if(where.length > 0)
            Where += ' WHERE ';
            where.forEach(function(item){
                if(typeof item === 'object'){
                    if(false === DB.schema.check(item))
                        return;
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
                            if(DB.schema[table][field].type !== 'int')
                                item[2] = "'"+sqlEscape(item[2])+"'";
                            condition = table+'.'+field + ' = ' + item[2] + '';
                            break;
                        case 'has':
                            condition = table+'.'+field + ' ILIKE \'%' + sqlEscape(item[2]) + '%\' ';
                            break;
                        case 'like':
                            condition = table+'.'+field + ' ILIKE \'' + sqlEscape(item[2]) + '\' ';
                            break;
                        case '!=':
                        case 'not equal':
                            if(DB.schema[table][field].type !== 'int')
                                item[2] = "'"+item[2]+"'";
                            condition = table+'.'+field + ' != ' + item[2] + '';
                            break;
                    }
                    Where += '('+condition+')';
                }
                else if(typeof item === 'string' && (item.toLowerCase()==='and' || item.toLowerCase()==='or' ||item === '(' || item === ')')){
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
    public.schema.check = function(item){
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
            case 'match':
                if(DB.schema[table][field].hasOwnProperty('pattern')){
                    if(false === value.match(DB.schema[table][field]['pattern']))
                        return false;
                }
                else if(DB.schema[table][field]['type'] === 'int' && (value !== null || value !== 'NULL') && (isNaN(parseInt(value)) || (item[3]!==undefined && isNaN(parseInt(item[3])))))
                    return false;
                else if(DB.schema[table][field]['type'] === 'string' && (typeof value !== 'string' || value.length > DB.schema[table][field]['size']))
                    return false;
                break;
            case 'like':
                if(DB.schema[table][field]['type'] !== 'string' || typeof value !== 'string')
                    return false;
                break;
        }
        return true;
    };
    
    /*
     * Method creates SELECT SQL by passing data and sends query
     * 
     * @param object fields | ex: {'table':[field,...],..}
     * @param array from | ex: [table,...]
     * @param object params | ex: {'join':{'type':inner,'table':table,'on':[[[table,field]],'=',[table,field]]}
     *                             'where':[[[table,field],equals,value],'and',...],
     *                             'order':{'by':[[table,field],...],'direction':'asc'},
     *                             'limit':{offset:num,limit:num}}
     * @param function callback = function(err,result) 
     */
    public.select = function(fields, from, params, callback){
        var Selection = 'SELECT ';
        var flds = [];
        if(fields === '*' || fields === 'all' || fields === undefined){
            Selection += '*';
        }
        else
            for(var table in fields){
                if(fields[table] === '*' || fields[table] === 'all')
                    flds.push(table+'.'+'*');
                else
                    for(var i=0; i<fields[table].length; i++){
                        var fldStr;
                        if(fields[table][i] !== '*')
                            fldStr = table+'.'+fields[table][i];
                        else
                            fldStr = table+'.'+'*';
                        flds.push(fldStr);
                    }
            }
        Selection += flds.join(', ');
        Selection += ' FROM ';
        from.forEach(function(val,i,from){
            from[i] = val;
        });
        Selection += from.join(', ');
        if(params.hasOwnProperty('join')){
            var on=[];
            Selection += (' '+params.join.type.toUpperCase()+' JOIN '+params.join.table);
            Selection += ' ON ';
            for(var i=0;i<params.join.on.length;i++){
                on.push(params.join.on[i][0][0]+'.'+params.join.on[i][0][1]+'='+params.join.on[i][2][0]+'.'+params.join.on[i][2][1]);
            }
            Selection += on.join(', ');
        }
        if(params.hasOwnProperty('where')){
            Selection += wherePart(params.where);
        }
        if(params.hasOwnProperty('order')){
            Selection += ' ORDER BY ';
            var ordered = [];
            params.order.by.forEach(function(item){
                ordered.push(item[0]+'.'+sqlEscape(item[1]));
            });
            Selection += ordered.join(', ')+' ';
            if(params.order.direction.toLowerCase() === 'asc' || params.order.direction.toLowerCase() === 'desc'){
                Selection += params.order.direction.toUpperCase();
            }
            else
                Selection += 'ASC';
        }
        if(params.hasOwnProperty('limit')){
            if(params.limit.hasOwnProperty('limit'))
                Selection += ' LIMIT '+parseInt(params.limit.limit);
            if(params.limit.hasOwnProperty('offset'))
                Selection += ' OFFSET '+parseInt(params.limit.offset);
        }
        Selection += ';';
        
        return sendQuery(Selection,callback);
    };
    /*
     * Method creates INSERT query by scheme
     * 
     * @param string table
     * @param object data | ex {'field1':'value', 'field2':'value'....}
     * @param function callback = function(err,result) 
     * @param bool returnInserted
     */
    public.insert = function(table, data, callback, returnInserted){
        
        //Equivalent of Object.keys() from ES6
        var fields = [], i = 0;
        for (fields[i++] in data) {}
        
        if(fields.length===0)
            return callback({'status':400,'desc':'Error: nothing was added. Fields are empty.'});
        
        var Insert = 'INSERT INTO '+table+ ' ('+fields.join(', ')+') VALUES (';
        var vals = [];
        for(var key in data){ 
            if(false === DB.schema.check([[table,key],'match',data[key]]))
                return callback({'status':400,'desc':'Wasn\'t created. Error in field '+table+'.'+key});
            if(DB.schema[table][key].type === 'string')
                data[key] = "'"+sqlEscape(data[key])+"'";
            vals.push(data[key]);
        }
        Insert += (vals.join(', ')+') ');
        if(returnInserted === true){
            Insert += ' RETURNING ';
            var fields = [];
            for(var field in DB.schema[table]){
                fields.push(field);
            }
            Insert += fields.join(', ');
        }
        
        Insert += ';';
        
        return sendQuery(Insert,callback);
    };
    /*
     * Method creates UPDATE query
     * 
     * @param string table
     * @param object data | ex {'field1':'value', 'field2':'value'....}
     * @param array where |ex [[[table,field],equals,value],'and',...]
     * @param function callback = function(err,result) 
     */
    public.update = function(table, data, where, callback){
        var Update = 'UPDATE '+table+' SET ';
        var vals = [];
        for(var key in data){
            if(false === DB.schema.check([[table,key],'match',data[key]]))
                return callback({'status':304,'desc':'Wasn\'t modified. Error in field '+table+'.'+key});
            if(false === DB.schema[table][key].hasOwnProperty('sequence')){
                if(DB.schema[table][key].type === 'string')
                    data[key] = "'"+sqlEscape(data[key])+"'";
                vals.push(key+'='+data[key]);
            }
        }
        if(vals.length===0)
            return callback({'status':304,'desc':'Error: nothing was modified. Fields are empty.'});
        Update += (vals.join(', '));
        Update += wherePart(where)+';';
        
        return sendQuery(Update,callback);
    };
    /*
     * Method creates DELETE query for deletiong from table
     * 
     * @param string table
     * @param array what |ex [[[table,field],equals,value],'and',...]
     * @param function callback = function(err,result)
     */
    public.delete = function(table, what, callback){
        var Delete = 'DELETE FROM '+table+wherePart(what)+' RETURNING *;';
        return sendQuery(Delete, callback);
    };
    public.query = sendQuery;
    return public;
})();

module.exports = DB;
