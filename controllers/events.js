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

    //////////////////////////////////////////////////////////////////////////
    //console.log(req.currentUser);
    
    events.find(eventParams, returnParams, function(err,result){
        return res.json(result || err);
    });
});

module.exports = router;
