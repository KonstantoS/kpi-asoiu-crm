var Model = require('./model');
var db = require('../libs/database');
var config = require('../libs/config');
var perm = require('../libs/permissions');

/*
 * See DB schema at: libs/schemas.js
 */
var Post = function(data){
    this._object = 'Post';
    this._schema = 'news';
    Model.apply(this,arguments);
};
Post.prototype = Object.create(Model.prototype);
Post.prototype.constructor = Post;

Post.prototype._import_({

});

module.exports = Post;