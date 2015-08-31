var express = require('express');
var router = express.Router();
var Document = require('../models/document');
var fse = require('fs-extra');
var formidable = require('formidable');
var access = require('../libs/rolemanager');

router.get('/', access.UserCanIn('documents','browse'), function(req, res, next) {
    var doc = new Document();
    var returnParams = {};

    if(req.query.hasOwnProperty('order')){
        returnParams.order = {'direction':req.query.order.direction || 'asc','by':[['documents',req.query.order.by || 'name']]};
    }
    if(req.query.hasOwnProperty('shared')){
        returnParams.shared = true;
    }
    if(req.query.hasOwnProperty('search')){
        doc.erase();
        doc.fill(req.query.search);
    }


    if(req.query.hasOwnProperty('search') || returnParams.shared === true) {
        doc.findAll(doc.data() || 'all',returnParams,req.currentUser,function(err,result){
            return res.json(result || err);
        });
    }
    else{
        doc.find({
            'parent_id':0,
            'owner_id':req.currentUser.id
        },returnParams,function(err,result){
            return res.json(result || err);
        });
    }
});

/*router.get('/:id?', access.UserCanIn('documents','browse'), function(req, res, next) {
    var doc = new Document({'id': isNaN(parseInt(req.params.id)) ? 0 : parseInt(req.params.id)});
    doc.userAccess(req.currentUser,function(access){

        /*if(req.query.hasOwnProperty('search'))
            doc.fill(req.query.search);

        if(access < 1)
            return res.json({'status':403,'desc':'Access denied!'});
        else
            doc.getInfo(doc.data(),function(err,file){
                doc.fill(file);
                if(doc.isFolder()) {
                    if (doc.id === 0) doc.set('owner_id', req.currentUser.id);
                    doc.getContent(function (err, content) {
                        return res.json(content || err);
                    });
                }
                else
                    res.download('./uploads/'+doc.pathByHash(doc.hash), doc.original_name);
            });
    });
});*/
router.get('/:id', access.UserCanIn('documents','browse'), function(req, res, next) {
    var doc = new Document({'id': isNaN(parseInt(req.params.id)) ? 0 : parseInt(req.params.id)});
    doc.userAccess(req.currentUser,function(err, result){
        console.log(result);
        if(err !== null)
            return res.json(err);
        else if(result.maxAccess < 1)
            return res.json({'status':403,'desc':'Access denied!'});
        else{
            doc.fill(result);
            if(doc.isFolder()) {
                if (doc.id === 0) doc.set('owner_id', req.currentUser.id);

                doc.getContent(function (err, content) {
                        return res.json(content || err);
                });
            }
            else
                res.download('./uploads/'+doc.pathByHash(doc.hash), doc.original_name);
        }
    });
});
router.post('/:id?', access.UserCanIn('documents','create'), function(req,res,next){
    var doc = new Document({'id': isNaN(parseInt(req.params.id)) ? 0 : parseInt(req.params.id)});
    doc.userAccess(req.currentUser,function(err, result){
        if(result.maxAccess < 2)
            return res.json({'status':403,'desc':'You can\'t upload to this directory.'});

        var form = new formidable.IncomingForm();
        var errorList = [];

        form.hash = 'sha1';
        form.multiples = true;
        form.uploadDir = './uploads/tmp';

        //TODO: Upload progress streaming
        /*form.on('progress', function(bytesReceived, bytesExpected) {
            console.log('Progress so far: '+(100*(bytesReceived/bytesExpected))+"%");
        });*/

        form.parse(req, function(err, fields, files){
            if(files.upload !== undefined)
                files.upload.forEach(function(file){
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

                                        currDoc.erase();
                                        currDoc.fill({'hash':existing[0].hash});
                                        currDoc.inUse(function(err,result){
                                           if(err.status === 404 || result.rowCount === 0)
                                               fse.unlink('./uploads/'+currDoc.pathByHash(currDoc.hash),function(err){});
                                        });

                                    });
                                });
                            }

                            else{
                                fse.unlink(tmp_path,function(err){});
                            }

                        });
                    });
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

//TODO: SHARING

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

//TODO: Folder deleting

router.delete('/:id', access.UserCanIn('documents','create'), function(req,res){
    var doc = new Document({'id':parseInt(req.params.id)});
    doc.userAccess(req.currentUser,function(err, result){
        if(result.maxAccess < 2)
            return res.json({'status':403,'desc':'You can\'t delete this object!'});
        doc.remove(function(err,result){
            if(result !== undefined && result.rowCount > 0){
                doc.erase();
                doc.fill({'hash':result.rows[0].hash});
                doc.inUse(function(err,result){
                    if(err.status === 404 || result.rowCount === 0)
                        fse.unlink('./uploads/'+doc.pathByHash(doc.hash),function(err){});
                });
            }
            return res.json(err);
        });
    });
});
module.exports = router;
