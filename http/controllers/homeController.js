var User = require('../../models/userModel');
var Auth = require('../middleware/authentication');

exports.home = function(req, res, next) {
  res.render('home',{
    auth:true,
    user:Auth.Auth(req,res).user,
  });
};

exports.index = function (req,res,next){
  if(typeof req.cookies.token == 'undefined'){
    res.render('index');
  }
  res.render('index',{
    auth:true,
    user:Auth.Auth(req,res).user,
  });
}
