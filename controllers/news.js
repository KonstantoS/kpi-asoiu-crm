var express = require('express');
var router = express.Router();
var Post = require('../models/post');
var access = require('../libs/rolemanager');

/* GET all users list */
router.get('/', access.UserCanIn('news','browse'), function(req, res, next) {
    var Feed = new Post();
    var returnParams = {
        'fields':['id','title','content','tags','author_id','access','creation_time','preview_url']
    };
    var newsParams = 'all';
    
    returnParams.limit = {};
    returnParams.limit.limit = 5;
    returnParams.order = {'direction':'desc','by':[['news','creation_time']]};
    
    if(req.query.hasOwnProperty('limit')){
        returnParams.limit.limit = parseInt(req.query.limit);
    }
    if(req.query.hasOwnProperty('offset')){
        returnParams.limit.offset = parseInt(req.query.offset); 
    }   
    if(req.query.hasOwnProperty('order')){
        returnParams.order = {'direction':req.query.order.direction,'by':[['news',req.query.order.by]]};
    }
    
    
    Feed.find(newsParams, returnParams, function(err,result){
        return res.json(result || err);
    });
});

router.get('/tags/:id', access.UserCanIn('news','browse'), function(req, res, next) {
    var Feed = new Post();
    var returnParams = {
        'fields':['id','title','content','tags','author_id','access','creation_time','preview_url']
    };
    var newsParams = {'tags':req.params.id} ;
    //return res.json(newsParams);
    returnParams.limit = {};
    returnParams.limit.limit = 5;
    returnParams.order = {'direction':'desc','by':[['news','creation_time']]};
    
    if(req.query.hasOwnProperty('limit')){
        returnParams.limit.limit = parseInt(req.query.limit);
    }
    if(req.query.hasOwnProperty('offset')){
        returnParams.limit.offset = parseInt(req.query.offset); 
    }   
    if(req.query.hasOwnProperty('order')){
        returnParams.order = {'direction':req.query.order.direction,'by':[['news',req.query.order.by]]};
    }
        
    Feed.find(newsParams, returnParams, function(err,result){
        return res.json(result || err);
    });
});

router.post('/', access.UserCanIn('news','create'), function(req,res){
    var thread = new Post();
    var fillTry = thread.fill(req.body);
    //res.json(req.body);
    if (!req.body.hasOwnProperty('title') ||
        !req.body.hasOwnProperty('content') ||
        !req.body.hasOwnProperty('author_id') ||
        !req.body.hasOwnProperty('access')) {
            res.json({'status':400,'desc':'Bad request'});
        }
    else {
        if(true === fillTry){
            thread.save(function(err,result){
                return res.json(result || err);
            });
        }
        else
            res.json(fillTry);
    }
});

router.get('/:id', access.UserCanIn('news','browse'), function(req,res){
    if(isNaN(req.params.id)) {
        res.json({'status':400,'desc':'Bad request'});
    }
    else {
        new Post().byId(req.params.id,function(err,user){
            return res.json(user || err);
        });
    }
});

router.put('/:id', access.UserCanIn('news','browse'), function(req,res){
    var isCurrent = (req.currentUser.id === parseInt(req.params.id));
    if(false === isCurrent && false === req.currentUser.canIn('users','modifyAll'))
        return res.json({'status':403,'desc':'Access denied! You can\'t modify thread'});
    
    if(req.body.hasOwnProperty('role'))
        if((isCurrent && (req.body.role < access.permissions.users.changeRole)) || (!isCurrent && false === req.currentUser.canIn('users','changeRole')))
            return res.json({'status':304,'desc':'Thread was\'t updated. You can\'t change roles or downgrade own.'});
    
    var thread = new Post({'id':parseInt(req.params.id)});
    var fillTry = thread.fill(req.body);
    if(true === fillTry){
        thread.save(function(err,result){
            return res.json(result || err);
        });
    }
    else
        res.json(fillTry);
});

router.delete('/:id', access.UserCanIn('news','browse'), function(req,res){
    var isCurrent = (req.currentUser.id === parseInt(req.params.id));
    if(false === isCurrent && false === req.currentUser.canIn('news','modifyAll'))
        return res.json({'status':403,'desc':'Access denied! You can\'t delete thread'});
    
    var thread = new Post({'id':parseInt(req.params.id)});
    thread.remove(function(err,result){
        return res.json(result || err);
    });
});


module.exports = router;