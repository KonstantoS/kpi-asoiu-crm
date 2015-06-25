var express = require('express');
var router = express.Router();
var User = require('../models/user');

/* GET users listing. */
router.get('/', function(req, res, next) {
    var users = new User();
    users.findUsers({},{},function(result,err){
        if(typeof err === 'object')
            return res.json(err);
        else
            res.json(result);
    });
});

router.post('/',function(req,res,next){
    res.json(req.body);
});

router.get('/:id',function(req,res,next){
    var user = new User();
    user.byId(req.params.id,function(user,err){
        if(typeof err !== 'object')
            res.json(user);
        else{
            res.json(err);
        }
    });
});

module.exports = router;
