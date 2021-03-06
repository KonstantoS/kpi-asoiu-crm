var db = require('../libs/database');
var config = require('../libs/config');
var encryption = require('sha256');
/*
 * See DB schema at: libs/schemas.js
 */
var Model = function(data){
    for(var field in data)
        if(db.schema[this._schema].hasOwnProperty(field))
            this.set(field,data[field])
};

Model.prototype = {
    _import_: function(obj){
        if(typeof obj === 'object' && obj !== undefined)
            for(var key in obj)
                this[key] = obj[key];
    },
    _encrypt: function(val){
        return encryption(val+config.get('security:salt'));
    },
    data: function(params){
        var data = {};
    	var params = params || {'encrypted':false};
        for(var key in this){
            if(this.hasOwnProperty(key)){
                if(this[key] !== null && db.schema[this._schema].hasOwnProperty(key) && (!db.schema[this._schema][key].encrypted || params.encrypted))
                    data[key] = this[key];
            }
        }
        return data;
    },
    /*
     * Setter of Model object. 
     * Checks format of data in database schema. If data is wrong erases object. 
     * @param object field | ex. {id:1,name:'John Doe'...} 
     * @returns error object or true 
     */
    fill: function(fields){
        for(var field in fields){
            if(db.schema[this._schema].hasOwnProperty(field))
                if(fields[field] !== null)
                    if(this.set(field, fields[field]) !== true){
                        this.erase();
                        return {'status':400,'desc':this._object+' wasn\'t filled. Wrong data in field: '+field};
                    }
        }
        return true;
    },
    /*
     * Field setter.
     * Checks data if wrong returns false
     * @param string "prop" property name
     * @param var "val" property value
     * @return bool
     * 
     */
    set: function(prop, val){
        if(db.schema.check([[this._schema,prop],'match',val])){
            if(db.schema[this._schema][prop].encrypted)
                val = this._encrypt(val);
            this[prop] = val;
        }
        else
            return false;
        
        return true;
    },
    /*
     * Saves object in database
     * If object exists - updates his data in database. Otherwise add's his to database.
     * @param callback function(err, result) 
     *  
     */
    save: function(callback){
        var self = this;
        this.isUnique(function(err){
            if(err === null){
                if(true === isNaN(parseInt(self.id)))
                    db.insert(self._schema,self.data({'encrypted':true}),function(err, result){
                        if(err !== null)
                            return callback(err);
                        else
                            return callback({'status':200,'desc':self._object+' was created.'});
                    });         
                else
                    db.update(self._schema,self.data({'encrypted':true}),[[[self._schema,'id'],'=',self.id]],function(err,result){
                        if(err !== null)
                            return callback(err);
                        else if(result.rowCount > 0)
                            return callback({'status':201,'desc':self._object+' was updated.'});
                        else
                            return callback({'status':400,'desc':self._object+' wasn\'t modified or not found.'});
                    });
            }
            else
                callback(err);
        });
    },
    /*
     * Erases models' fields and properties
     */
    erase: function(){
        for(var field in db.schema[this._schema]){
            this[field] = null;
        }
    },
    /*
     * Removes current object from database.
     * @param callback function(err,result)
     */
    remove: function(callback){
        var self = this;
        db.delete([this._schema],[[[this._schema,'id'],'=',this.id]],function(err,result){
            if(err !== null)
                return callback(err);
            else if(result.rowCount>0)
                return callback({'status':200,desc:self._object+' was deleted.'}, result);
            else
                return callback({'status':400,desc:self._object+' wasn\'t deleted or not found.'});
        });
    },
    isUnique: function(callback){
        var self = this;
        var uniqueFields = [];
            
        for(var field in db.schema[this._schema]){
            if(true === db.schema[this._schema][field].unique){
                uniqueFields.push(field);
            }
        }
        
        if(uniqueFields.length === 0){
            callback(null);
        }
        else{
            db.select('all',[this._schema],{
                'where':(function(){
                    var whereArr = [];
                    
                    uniqueFields.forEach(function(field,i){
                        if(self[field] === undefined) return;
                        
                        if(i>0) whereArr.push('or');
                        whereArr.push([[self._schema,uniqueFields[i]],'=',self[uniqueFields[i]]]);
                    });
                    if(false === isNaN(parseInt(self.id))){
                        if(whereArr.length>0) whereArr.push('and');
                        whereArr.push([[self._schema,'id'],'!=',self.id]);
                    }
                    
                    return whereArr;
                })()
            },function(err,result){
                if((typeof result === 'object' && result.rowCount===0) || (err !== null && err.status === 404))
                    callback(null);
                else if(typeof result === 'object'){
                    var notUnique = [];
                    result.rows.forEach(function(item){
                        for(var field in item){
                            if(self[field] === item[field])
                                notUnique.push(field);
                        }
                    });
                    return callback({'status':400,'desc':self._object+' wasn\'t modified. Field(s): ['+notUnique.toString()+'] not unique'});
                }
                else
                    return callback(err);
            });
        }
    },
    /*
     * Looking up object by his props in database.
     * @param object objectProp | ex. 'all' or {id:1,name:...}
     * @param object param | ex. {order:{...},limit:{...},fields:[...]} 
     * @param callback function(err,result)
     * @param bool single - if single object object is needed
     * @return to callback - array of objects objects or single object object
     */
    find: function(objProp, params, callback, single){
        single = (single !== undefined) ? single : false;
        objProp = (objProp === 'all') ? {} : objProp; 
        var self = this;
        var queryParams = {};
        var fields;
        
        if(typeof objProp === 'object'){
            var whereArr = [];
            var i=0;
            for(var field in objProp){
                if(db.schema[this._schema].hasOwnProperty(field)){
                    if(i>0)
                        whereArr.push('and');
                    if(db.schema[this._schema][field].encrypted)
                        objProp[field] = this._encrypt(objProp[field]);
                    if(db.schema.check([[this._schema,field],'match',objProp[field]])){
                        if(db.schema[this._schema][field].type==='string' && !single)
                            whereArr.push([[this._schema,field],'has',objProp[field]]);
                        else
                            whereArr.push([[this._schema,field],'=',objProp[field]]);
                        i++;
                    }
                }
            }
            queryParams.where = whereArr;
        }
        else
            queryParams.where = objProp;
            
        if(params.hasOwnProperty('order'))
            queryParams.order = params.order;
        if(params.hasOwnProperty('limit'))
            queryParams.limit = params.limit;
        if(single)
            queryParams.limit = {'amount':1};
        
        if(params.hasOwnProperty('fields')){
            if(params.fields === 'all')
                fields = params.fields;
            else{
                fields = {};
                fields[this._schema] = [];
                params.fields.forEach(function(field){
                    if(db.schema[this._schema].hasOwnProperty(field))
                        fields[this._schema].push(field);
                },this);
            }
        }     
        
        db.select(fields,[this._schema],queryParams,function(err,result){
            if(err !== null)
                return callback(err);
            if(result.rowCount===0)
                return callback({'status':404,'desc':self._object+' not found.'});
            var objectsData = [];
            result.rows.forEach(function(data){
                var object = new self.constructor(data);
                objectsData.push(object.data());
            });
            return callback(null,objectsData);
        });  
    },
    /*
     * Looking up single object by fields.
     * Uses Model.find method
     * @param objectParams
     * @param callback function(err,result)
     * @return to callback - object object
     */
    getInfo: function(objParams,callback){
        var self = this;
        this.find(objParams, {
            'fields':'all'
        }, function(err, result){
            if(err === null)
                self.fill(result[0]);
            return callback(err, self.data());
        });
    },
    /*
     * Looking up model by id.
     * Alias for Model.getInfo({id:int},callback)
     * @param uid - object id
     * @param callback function(err,result)
     * @return to callback - object object
     */
    byId: function(id,callback){
        this.getInfo({'id':parseInt(id)},callback);
    }
};

module.exports = Model;
