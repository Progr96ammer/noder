var Auth = require('../../middleware/authentication');
var User = require('../../../models/userModel');
var crypto = require('crypto');
const { check, validationResult } = require('express-validator');

exports.deleteUserForm = function(req, res, next) {
  if (!Auth.checkAuth(req)) {
    res.render('auth/login');
  }
  User.findOne({_id:Auth.Auth(req).decoded.id}, function(err, user){
  	if (!user) {
      res.render('./errors/error',{error:500,msg:"Server Error"});
    }
    res.render('auth/deleteUser',{
      auth:Auth.Auth(req).Auth,
      user:user,
    });
  });
};


exports.deleteUser = [
check('password')
.isLength({ min: 8 }).withMessage('Password Must Be At Least 8 Charecter')
.bail()
.custom((value, {req}) => {
    return new Promise((resolve, reject) => {
        User.findById(Auth.Auth(req).decoded.id, function(err, user){
          if(err) {
            reject(new Error('Soory We Cann`t Complete Your Procedure Right Now!'))
          }
          else if (!user) {
            reject(new Error('Incorrect Password'))
          }
          else if(crypto.createHash('md5').update(value).digest("hex")!== user.password) {
            reject(new Error('Incorrect Password!'))
          }
          resolve(true)
        });
    });
  }),
(req, res, next)=> {
  const errors = validationResult(req);
    if (!errors.isEmpty()){
       res.send({errors: errors.array()});
    }
    else{
      User.deleteOne({ _id:Auth.Auth(req).decoded.id}, function(err, user){
          if(err) {
            res.render('./errors/error',{error:500,msg:"Server Error"});
          }
          	res.clearCookie('token');
    		res.render('./index');
        });
    }
  },
];