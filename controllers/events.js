var express = require('express');
var router = express.Router();
var Event = require('../models/event');
var access = require('../libs/rolemanager');


/* GET all events list */
router.get('/', access.UserCanIn('events','browse'), function(req, res, next) {
    var events = new Event();
    var returnParams = {
        //'fields':['id','login','name','role','position','about','avatar_url']
    };
    var eventParams = 'all';
    
    //?order[by]=&order[direction]=&limit=&offset=
    if(req.query.hasOwnProperty('limit') || req.query.hasOwnProperty('offset')){
        returnParams.limit = {};
        if(req.query.hasOwnProperty('limit'))
            returnParams.limit.limit = parseInt(req.query.limit);
        if(req.query.hasOwnProperty('offset'))
            returnParams.limit.offset = parseInt(req.query.offset);
    }
    if(req.query.hasOwnProperty('order')){
        returnParams.order = {'direction':req.query.order.direction,'by':[['events',req.query.order.by]]};
    }
    if(req.query.hasOwnProperty('search'))
        eventParams = req.query.search;
    
    events.find(eventParams, returnParams, function(err,result){
        return res.json(result || err);
    });
});
router.post('/', access.UserCanIn('events','create'), function(req,res){
    var event = new Event();
    var fillTry = event.fill(req.body);
    if(true === fillTry){
        event.save(function(err,result){
            return res.json(result || err);
        });
    }
    else
        res.json(fillTry);
});
router.get('/:id', access.UserCanIn('events','browse'), function(req,res){
    var event = new Event();
    event.byId(req.params.id,function(err,event){
        return res.json(event || err);
    });
});



router.put('/:id', access.UserCanIn('events','create'), function(req,res){
    var event = new Event({'id':parseInt(req.params.id)});

    if(false === req.currentUser.isOwner(event) && false === req.currentUser.canIn('events','modifyAll'))
        return res.json({'status':403,'desc':'Access denied! You can\'t modify event.'});

    var fillTry = event.fill(req.body);
    if(true === fillTry){
        event.save(function(err,result){
            return res.json(result || err);
        });
    }
    else
        res.json(fillTry);
});
router.delete('/:id', access.UserCanIn('events','modifyAll'), function(req,res){
    var event = new Event({'id':parseInt(req.params.id)});
    event.remove(function(err,result){
        return res.json(result || err);
    });
});
module.exports = router;
