var express = require('express');
var router = express.Router();
var User = require('../models/user');
var access = require('../libs/rolemanager');
var translit = require('../libs/translit');

/* GET all users list */
router.get('/', access.UserCanIn('users','browse'), function(req, res, next) {
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
        returnParams.order = {'direction':req.query.order.direction || 'ASC','by':[['users',req.query.order.by || 'name']]};
    }
    if(req.query.hasOwnProperty('search'))
        userParams = req.query.search;

    users.find(userParams, returnParams, function(err,result){
        return res.json(result || err);
    });
});
/* POST request creates new user */
router.post('/', access.UserCanIn('users','create'), function(req,res){
    var user = new User();
    var fillTry = user.fill(req.body);
    if(true === fillTry){
        user.save(function(err,result){
            return res.json(result || err);
        });
    }
    else
        res.json(fillTry);
});

router.get('/generate', access.UserCanIn('users','create'), function(req,res){
    function rand(max) {
        return Math.floor(Math.random() * (max + 1));
    }
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    var fs = require('fs');
    var firstNames = fs.readFileSync('generationData/names.txt').toString().split("\n");
    var secondNames = fs.readFileSync('generationData/secNames.txt').toString().split("\n");
    var count = 1000;
    var pass = 'asukpiua';
    for (var i = 0; i < count; i++) { 
        var name = firstNames[rand(firstNames.length)],
            surname = secondNames[rand(secondNames.length)];
            var fio = capitalizeFirstLetter(name).replace(/(\r\n|\n|\r)/gm," ")+' '+ capitalizeFirstLetter(surname).replace(/(\r\n|\n|\r)/gm," ");
            var login = translit(name.replace(/(\r\n|\n|\r)/gm,"")+'.'+surname.replace(/(\r\n|\n|\r)/gm,""),5).replace('`','').toLowerCase().replace(' ','');
            var request = {
                "name": fio, 
                "email": login + '@kpi.ua',
                "login": login,
                "password": pass,
                "role" : 1   
            } 
            var user = new User();
            var fillTry = user.fill(request);
            if(true === fillTry){
                user.save(function(err,result){
                    //return res.json(result || err);
                });
            }  
    }
    res.json({'status':200,'desc':count + ' users was created'});
});


router.get('/:id', access.UserCanIn('users','browse'), function(req,res){
    var user = new User();
    if(req.params.id === 0)
        return res.json(req.currentUser.data());
    user.byId(!isNaN(parseInt(req.params.id)) ? parseInt(req.params.id) : -1 ,function(err,user){
        return res.json(user || err);
    });
});
router.put('/:id', access.UserCanIn('users','browse'), function(req,res){
    var isCurrent = (req.currentUser.id === parseInt(req.params.id));
    if(false === isCurrent && false === req.currentUser.canIn('users','modifyAll'))
        return res.json({'status':403,'desc':'Access denied! You can\'t modify user'});
    
    if(req.body.hasOwnProperty('role'))
        if((isCurrent && (req.body.role < access.permissions.users.changeRole)) || (!isCurrent && false === req.currentUser.canIn('users','changeRole')))
            return res.json({'status':304,'desc':'User was\'t updated. You can\'t change roles or downgrade own.'});
    
    var user = new User({'id':parseInt(req.params.id)});
    var fillTry = user.fill(req.body);
    if(true === fillTry){
        user.save(function(err,result){
            return res.json(result || err);
        });
    }
    else
        res.json(fillTry);
});
router.delete('/:id', access.UserCanIn('users','modifyAll'), function(req,res){
    var user = new User({'id':parseInt(req.params.id)});
    user.remove(function(err,result){
        return res.json(result || err);
    });
});

/*
 * Contacts part
 */
router.get('/:id/contacts', access.UserCanIn('users','browse'), function(req,res){
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
        return res.json(result || err);
    });
    
});
router.post('/:id/contacts', access.isCurrentUser, function(req,res){
    if(req.currentUser.id !== parseInt(req.params.id))
        res.json({'status':403,'desc':'Access denieded! You can\'t modify users\' contacts'});
    
    if(req.body.hasOwnProperty('contact_id') === false)
        return res.json({'status':400,'desc':'Bad request. Contact ID is empty.'});
    
    req.currentUser.addContact(req.body.contact_id,function(err,result){
        return res.json(result || err);
    });    
});
router.delete('/:id/contacts', access.isCurrentUser, function(req,res){
    if(req.currentUser.id !== parseInt(req.params.id))
        res.json({'status':403,'desc':'Access denieded! You can\'t modify users\' contacts'});
    
    if(req.body.hasOwnProperty('contact_id') === false)
        return res.json({'status':400,'desc':'Bad request. Contact ID is empty.'});
    
    req.currentUser.removeContact(req.body.contact_id, function(err,result){
        return res.json(err);
    });   
});

module.exports = router;
