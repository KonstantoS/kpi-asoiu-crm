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

module.exports = router;
