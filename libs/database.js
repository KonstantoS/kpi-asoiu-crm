var pg = require('pg');
var config = require('../libs/config');

var DB = (function(pb, config){
    var conString = process.env.DATABASE_URL || 'postgres://'+config.get('db:user')+':'+config.get('db:pass')+'@'+config.get('db:host')+'/'+config.get('db:name');
    
    function sendQuery(queryString, data,_return){   
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
                    console.log(field+operator+condition);
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
        console.log(Selection); 
        sendQuery(Selection,[],callback);
    };
    public.insert = function(table, data){
        
    };
    public.update = function(table, params){
        
    };
    return public;
})(pg, config);

module.exports = DB;
