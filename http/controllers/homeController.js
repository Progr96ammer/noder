var User = require('../../models/userModel');
var Auth = require('../middleware/authentication');

exports.home = function(req, res, next) {
    res.send({url: '/home'});
};

exports.index = function (req,res,next){
  if(!Auth.checkAuth(req,res)){
    res.render('index');
  }
  res.render('index',{
    auth:true,
    user:Auth.Auth(req,res).user,
  });
}
exports.error = function (req,res,next){
  res.render('error',{
    errnum:req.query.errnum,
    errmsg:req.query.errmsg,
  });
}
