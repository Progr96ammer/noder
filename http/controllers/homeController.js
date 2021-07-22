var User = require('../../models/userModel');
var Auth = require('../middleware/authentication');

exports.home = function(req, res, next) {
  User.findOne({_id:Auth.Auth(req).decoded.id}, function(err, user){
  	if (!user) {
      res.render('./errors/error',{error:500,msg:"Server Error"});
    }
    res.render('home',{
      auth:Auth.Auth(req).Auth,
      user:user,
    });
  });
};