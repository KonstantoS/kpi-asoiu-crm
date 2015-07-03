var express = require('express');
var router = express.Router();
var User = require('../models/user');

/* GET all users list */
router.get('/',function(req, res, next) {
    var users = new User();
    var returnParams = {
        'fields':['id','login','name','role','position','about','avatar_url']
    };
    var userParams = 'all';
    
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
    if(req.query.hasOwnProperty('search'))
        userParams = req.query.search;

    //////////////////////////////////////////////////////////////////////////
    console.log(req.currentUser);
    
    users.findUsers(userParams, returnParams, function(err,result){
        if(err.hasOwnProperty('status'))
            return res.json(err);
        else
            res.json(result);
    });
});
/* POST request creates new user */
router.post('/',function(req,res){
    var user = new User(); //Don't using constructor to avoid errors in fields. Otherwise filler is beeing used.
    var fillTry = user.fill(req.body);
    if(true === fillTry){
        user.save(function(err,result){
            if(err.hasOwnProperty('status'))
                return res.json(err);
            else
                res.json(result);
        });
    }
    else
        res.json(fillTry);
});

router.get('/:id',function(req,res){
    var user = new User();
    user.byId(req.params.id,function(err,user){
        if(err.hasOwnProperty('status') === false)
            res.json(user);
        else{
            res.json(err);
        }
    });
});
router.put('/:id',function(req,res){
    /*var user = new User();
    user.byId(req.params.id,function(err,usr){
        if(err.hasOwnProperty('status') === false){
            var user = new User({'id':usr.id});
            var fillTry = user.fill(req.body);
            if(true === fillTry){
                user.save(function(err,result){
                    if(err.hasOwnProperty('status'))
                        return res.json(err);
                    else
                        res.json(result);
                });
            }
            else
                res.json(fillTry);
        }
        else{
            res.json(err);
        }
    });*/
    var user = new User({'id':parseInt(req.params.id)});
    var fillTry = user.fill(req.body);
    if(true === fillTry){
        user.save(function(err,result){
            if(err.hasOwnProperty('status'))
                return res.json(err);
            else
                res.json(result);
        });
    }
    else
        res.json(fillTry);
});
router.delete('/:id',function(req,res){
    /*var user = new User();
    user.byId(req.params.id,function(err, usr){
        if(err.hasOwnProperty('status') === false){
            usr.remove(function(err,result){
                if(err.hasOwnProperty('status'))
                    return res.json(err);
                else
                    res.json(result);
            });
        }
        else{
            res.json(err);
        }
    });*/
    var user = new User({'id':parseInt(req.params.id)});
    user.remove(function(err,result){
        if(err.hasOwnProperty('status'))
            return res.json(err);
        else
            res.json(result);
    });
});

/*
 * Contacts part
 */
router.get('/:id/contacts',function(req,res){
    var user = new User({'id':parseInt(req.params.id)});
    var returnParams = {
        'fields':['id','login','name','role','position','about','avatar_url']
    };
    var userParams = 'all';
    
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
    if(req.query.hasOwnProperty('search'))
        userParams = req.query.search;

    user.getContacts(userParams,returnParams,function(err,result){
        if(err.hasOwnProperty('status'))
            return res.json(err);
        else
            res.json(result);
    });
    
});



module.exports = router;
