var Auth = require('../../middleware/authentication');
var User = require('../../../models/userModel');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var logout = require('../../controllers/auth/logoutController');
const { check, validationResult } = require('express-validator');

exports.deleteUserForm = function(req, res, next) {
    res.render('auth/deleteUser',{
        auth:true,
        user:Auth.Auth(req,res).user,
    });
};


exports.deleteUser = [
check('password')
.isLength({ min: 8 }).withMessage('Password Must Be At Least 8 Charecter')
.bail()
.custom((value, {req}) => {
    return new Promise((resolve, reject) => {
        User.findById(Auth.Auth(req).user._id, function(err, user){
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
      User.deleteOne({ _id:Auth.Auth(req).user._id}, function(err, user){
          if(err) {
              res.render('error',{errnum:500,errmsg:"Server Error"});
          }
          	logout.logout(req,res);
        });
    }
  },
];
