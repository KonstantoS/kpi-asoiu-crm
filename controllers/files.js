var express = require('express');
var router = express.Router();
var Document = require('../models/document');
var fse = require('fs-extra');
var formidable = require('formidable');
var access = require('../libs/rolemanager');


/* GET all docs list */
router.get('/', access.UserCanIn('documents','browse'), function(req, res, next) {
    var docs = new Document();
    var returnParams = {

    };
    var docParams = 'all';
    
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
router.post('/', access.UserCanIn('documents','create'), function(req,res){
    var doc = new Document({'owner_id':req.currentUser.id});
    var form = new formidable.IncomingForm();

    form.hash = 'sha1';
    form.multiples = true;
    form.uploadDir = './uploads';
    form.on('progress', function(bytesReceived, bytesExpected) {
        console.log('Progress so far: '+(100*(bytesReceived/bytesExpected))+"%");
    });
    form.on('error', function(err) {
        console.log('ERROR!');
        return res.json(err);
    });
    form.on('aborted', function() {
        console.log('ABORTED!');
        return res.json({'err':'aborted'});
    });
    form.parse(req, function(err, fields, files) {
        console.log(fields);
        console.log(files);
        files.upload.forEach(function(file){
            console.log(file);
            var upload_path = file.path,
                file_size = file.size,
                file_doctype = file.name.split('.').pop(),
                hash = file.hash,
                file_name = file.name,
                new_path = (function(hash){
                    var result='';
                    for(var i=0;i<hash.length;i+=2){
                        result += hash.substr(i,2);
                        result += (i<hash.length+2) ? '/' : '';
                    }
                    return result;
                })(hash);

            new_path = './uploads/'+new_path.substring(0, new_path.length - 1);

            if(false === fse.existsSync(new_path))
                fse.mkdirs(new_path.substring(0, new_path.length - 3), function (err) {
                    if (err) return console.json(err);
                    fse.move(upload_path, new_path, function (err) {
                        if (err) return console.error(err);

                        doc.fill({
                            'doctype':file_doctype,
                            'hash':hash,
                            'original_name':file_name
                        });
                        doc.fill(fields);
                        //if(true === fillTry){
                            doc.save(function(err,result){
                               // return res.json(result || err);
                            });
                        //}
                        //else
                           // res.json(fillTry);
                    });
                });
            else{
                fse.unlink(upload_path,function(err){
                    doc.fill({
                        'doctype':file_doctype,
                        'hash':hash,
                        'original_name':file_name
                    });
                    doc.fill(fields);
                    //if(true === fillTry){
                    doc.save(function(err,result){
                        // return res.json(result || err);
                    });
                });
            }
        });
        return res.json({'status':200,'desc':'Files where uploaded.'});
    });
});

router.get('/:id', access.UserCanIn('documents','browse'), function(req,res){
    var doc = new Document();
    doc.byId(req.params.id,function(err,doc){
        return res.json(doc || err);
    });
});



router.put('/:id', access.UserCanIn('documents','create'), function(req,res){
    var doc = new Document({'id':parseInt(req.params.id)});

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
