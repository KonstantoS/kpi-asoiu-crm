var express = require('express');
var router = express.Router();
var User = require('../models/user');

/* GET all users list */
router.get('/',function(req, res, next) {
    var users = new User();
    var returnParams = {
        'fields':['id','login','name','role','position','about','avatar_url']
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
        returnParams.order = {'direction':req.query.order.direction,'by':[['users',req.query.order.by]]};
    }
    
    console.log(req.currentUser);
    users.findUsers('all', returnParams, function(result,err){
        if(typeof err === 'object')
            return res.json(err);
        else
            res.json(result);
    });
});
/* POST requist creates new user */
router.post('/',function(req,res){
    var user = new User(); //Don't using constructor to avoid errors in fields. Otherwise filler is beeing used.
    var fillTry = user.fill(req.body);
    if(true === fillTry){
        user.save(function(result){
            res.json(result);
        });
    }
    else
        res.json(fillTry);
});

router.get('/:id',function(req,res){
    var user = new User();
    user.byId(req.params.id,function(user,err){
        if(typeof err !== 'object')
            res.json(user);
        else{
            res.json(err);
        }
    });
});
router.put('/:id',function(req,res){
    var user = new User();
    user.byId(req.params.id,function(usr,err){
        if(typeof err !== 'object'){
            var user = new User({'id':usr.id});
            var fillTry = user.fill(req.body);
            if(true === fillTry){
                user.save(function(result){
                    res.json(result);
                });
            }
            else
                res.json(fillTry);
        }
        else{
            res.json(err);
        }
    });
});
router.delete('/:id',function(req,res){
    var user = new User();
    user.byId(req.params.id,function(usr,err){
        if(typeof err !== 'object'){
            console.log(usr);
            usr.remove(function(result){
                res.json(result);
            });
        }
        else{
            res.json(err);
        }
    });
});

module.exports = router;
