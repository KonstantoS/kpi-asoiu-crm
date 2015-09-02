var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var app = express();

//   Controllers
var authModule = require('./libs/auth');
var users = require('./controllers/users');
var events = require('./controllers/events');
var docs = require('./controllers/docs');
var news = require('./controllers/news');

app.use(logger('dev'));
app.set('env','development');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/login',authModule.signIn);
app.use(authModule.checkAuth);
app.use('/users', users);
app.use('/news', news);
app.use('/events', events);
app.use('/docs', docs);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: {}
  });
});

module.exports = app;
