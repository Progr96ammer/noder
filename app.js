var createError = require('http-errors');
const https = require('https')
var express = require('express');
var cors = require('cors')
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var Auth = require('./http/middleware/authentication');
 var fileUpload = require('express-fileupload')
const fs = require('fs')
require('dotenv').config();
var db = require('./config/database');
var session = require('express-session')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const port = 3000

var app = express();
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
}));
app.use(cors({
        origin: '*',
        credentials:true,
    }))
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.SECRET_KEY));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/user', usersRouter);
app.use(function(req, res, next) {
	next(createError(404));
});
app.use(function(err, req, res, next) {
    res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');

});

// const httpsOptions = {
//     key: fs.readFileSync('./security/14153257_noder.com.key'),
//     cert: fs.readFileSync('./security/14153257_noder.com.cert')
// }
//
// https.createServer({
//     key: fs.readFileSync('./security/14153257_noder.com.key'),
//     cert: fs.readFileSync('./security/14153257_noder.com.cert')
// }, app).listen(3000, () => {
//     console.log('Listening...')
// });

var server = app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

module.exports = app;
