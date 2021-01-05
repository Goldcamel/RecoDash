var express       = require('express');
var path          = require('path');
var favicon       = require('serve-favicon');
var logger        = require('morgan');
var cookieParser  = require('cookie-parser');
var bodyParser    = require('body-parser');
var session       = require('express-session');
var flash         = require('connect-flash');

const SESSION_SECRET = 'gdazus90u09djgbzpnm';

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/dbusers', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false });

var profile = require('./routes/profile');
var questions = require('./routes/questions')
var mainpage = require('./routes/homepage');
var index = require('./routes/index');
var history = require('./routes/history');
var uploadquestions = require('./routes/uploadquestions');
var todomodule = require('./routes/todo');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

/*
 *  import Session middleware
 */
app.use(session({
  secret: SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {maxAge: 1000 * 60 * 60 * 24}
}));

app.use(function(req, res, next) {
  var url = req.originalUrl;
  if (url != '/' && url != '/register' && !req.session.userinfo) {
    return res.redirect('/');
  }
  next();
});

app.use('/homepage/profile', profile);
app.use('/questions', questions);
app.use('/uploadquestions', uploadquestions);
app.use('/history', history);
app.use('/todo', todomodule);
app.use('/homepage', mainpage);
app.use('/', index);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
