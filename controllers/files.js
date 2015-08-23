var express = require('express');
var router = express.Router();
var Document = require('../models/document');
var fse = require('fs-extra');
var formidable = require('formidable');
var access = require('../libs/rolemanager');

//TODO: post parts inheritance

router.get('/', access.UserCanIn('documents','browse'), function(req, res, next) {
    var docs = new Document();
    var returnParams = {
        'fields':['id','parent_id','original_name','doctype','title','desc','owner_id','tags','update_time']
    };
    var docParams = {
        'parent_id':0,
        'owner_id':req.currentUser.id
    };
    
    //?order[by]=&order[direction]=&limit=&offset=
    if(req.query.hasOwnProperty('limit') || req.query.hasOwnProperty('offset')){
        returnParams.limit = {};
        if(req.query.hasOwnProperty('limit'))
            returnParams.limit.limit = parseInt(req.query.limit);
        if(req.query.hasOwnProperty('offset'))
            returnParams.limit.offset = parseInt(req.query.offset);
    }
    if(req.query.hasOwnProperty('order')){
        returnParams.order = {'direction':req.query.order.direction,'by':[['docs',req.query.order.by]]};
    }
    if(req.query.hasOwnProperty('search'))
        docParams = req.query.search;
    
    docs.find(docParams, returnParams, function(err,result){
        return res.json(result || err);
    });
});
router.post('/:id?', access.UserCanIn('documents','create'), function(req,res,next){
    var doc = new Document({'id': isNaN(parseInt(req.params.id)) ? 0 : parseInt(req.params.id)});
    doc.userAccess(req.currentUser,function(access){
        if(access < 2)
            return res.json({'status':403,'desc':'You can\'t upload to this directory.'});

        var form = new formidable.IncomingForm();
        var errorList = [];

        form.hash = 'sha1';
        form.multiples = true;
        form.uploadDir = './uploads/tmp';

        //TODO: Upload progress streaming
        form.on('progress', function(bytesReceived, bytesExpected) {
            console.log('Progress so far: '+(100*(bytesReceived/bytesExpected))+"%");
        });

        form.parse(req, function(err, fields, files){
            if(files.upload !== undefined)
                files.upload.forEach(function(file){
                //for(var i=0, file=files.upload[0]; i<files.upload.length; file = files.upload[++i]){
                    var currDoc = new Document({
                            'parent_id':doc.id,
                            'owner_id':req.currentUser.id
                        }),
                        fill = currDoc.fill(fields);

                    if(false === fill) {
                        return res.json(fill);
                    }

                    var file_doctype = file.name.split('.').pop(),
                        tmp_path = file.path,
                        new_path = './uploads/'+(function(hash){
                                var result='';
                                for(var i=0;i<hash.length;i+=2){
                                    result += hash.substr(i,2);
                                    result += (i<hash.length-2) ? '/' : '';
                                }
                                return result;
                            })(file.hash);

                    currDoc.fill({
                        'doctype':file_doctype,
                        'hash':file.hash,
                        'original_name':file.name
                    });
                    currDoc.alreadyExists(function(err, existing){
                        if(Array.isArray(existing) && existing.length > 0)
                            currDoc.set('id',existing[0].id);

                        currDoc.save(function(err,result){
                            if(err !== null) errorList.push(err);

                            if(false === fse.existsSync(new_path)) { //Checking if file already exists in global storage
                                fse.mkdirs(new_path.substring(0, new_path.length - 3), function (err){
                                    if (err) return console.error(err);
                                    fse.move(file.path, new_path, function (err){
                                        if (err) return console.error(err);
                                    });
                                });
                            }
                            else{
                                fse.unlink(tmp_path,function(err){});
                            }

                        });
                    });
                    /*
                    console.log(currDoc.data());

                    if(false === fse.existsSync(new_path)) //Checking if file already exists in global storage
                        fse.mkdirs(new_path.substring(0, new_path.length - 3), function (err){
                            if (err) return console.error(err);
                            fse.move(file.path, new_path, function (err){
                                if (err) return console.error(err);
                                currDoc.save(function(err,result){
                                    if(err !== null) errorList.push(err);
                                });
                            });
                        });
                    else{
                        fse.unlink(file.path,function(err){
                            currDoc.save(function(err,result){
                                if(err !== null) errorList.push(err);
                            });
                        });
                    }*/
                } );
            else{
                var dir = new Document({
                        'parent_id':doc.id,
                        'owner_id':req.currentUser.id
                    }),
                    fillTry = dir.fill(fields);

                if(false === fillTry) {
                    return res.json(fillTry);
                }
                dir.alreadyExists(function(err, existing){
                    if(Array.isArray(existing) && existing.length > 0)
                        dir.set('id',existing[0].id);

                    dir.save(function(err,result){
                        if(err !== null) errorList.push(err);
                    });
                });

            }
            return !res.headersSent ? res.json((errorList.length === 0) ? {'status':200,'desc':'Document(s) successfully loaded'} : errorList) : '';
        });
    });
});
/*
router.post('/:id', access.UserCanIn('documents','browse'), function(req, res){
    var doc = new Document({'id':parseInt(req.params.id)});
    doc.userAccess(req.currentUser,function(access) {
        if (access < 2)
            return res.json({'status': 403, 'desc': 'Access denied!'});

    });
});*/


router.get('/:id', access.UserCanIn('documents','browse'), function(req,res){
    var doc = new Document({'id':parseInt(req.params.id)});
    doc.userAccess(req.currentUser,function(access){
        if(access < 1)
            return res.json({'status':403,'desc':'Access denied!'});
        else
            doc.byId(req.params.id,function(err,file){
                doc.fill(file);
                if(doc.isFolder())
                    doc.getContent(function(err,content){
                        return res.json(content || err);
                    });
                else
                    res.download('./uploads/'+doc.pathByHash(doc.hash), doc.original_name);
            });
    });
});



router.put('/:id', access.UserCanIn('documents','create'), function(req,res){
    var doc = new Document({
        'id':parseInt(req.params.id)
    });

    if(false === req.currentUser.isOwner(doc) && false === req.currentUser.canIn('docs','modifyAll'))
        return res.json({'status':403,'desc':'Access denied! You can\'t modify doc.'});

    var fillTry = doc.fill(req.body);
    if(true === fillTry){
        doc.save(function(err,result){
            return res.json(result || err);
        });
    }
    else
        res.json(fillTry);
});
router.delete('/:id', access.UserCanIn('documents','modifyAll'), function(req,res){
    var doc = new Document({'id':parseInt(req.params.id)});
    doc.remove(function(err,result){
        return res.json(result || err);
    });
});
module.exports = router;
