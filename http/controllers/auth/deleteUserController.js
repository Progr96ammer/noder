var Auth = require('../../middleware/authentication');
var User = require('../../../models/userModel');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var logout = require('../../controllers/auth/logoutController');
const { check, validationResult } = require('express-validator');
const fs = require("fs");

exports.deleteUserForm = function(req, res, next) {
    res.render('auth/deleteUser',{
        auth:true,
        user:Auth.Auth(req,res).user,
    });
};


exports.deleteUser = [
check('password')
.notEmpty().withMessage('Password Required!')
.bail()
.isLength({ min: 8 }).withMessage('Password Must Be At Least 8 Charecter')
.bail()
.custom((value, {req}) => {
    return new Promise((resolve, reject) => {
        User.findById(Auth.Auth(req).user._id, function(err, user){
          if(err || !user) {
            reject(new Error('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!'))
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
        if (Auth.Auth(req).user.avatar != '' && fs.existsSync('public' + Auth.Auth(req).user.avatar)){
            fs.unlinkSync('public' + Auth.Auth(req).user.avatar)
        }
      User.deleteOne({ _id:Auth.Auth(req).user._id}, function(err, user){
          if(err) {
              res.send('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!');
          }
          res.clearCookie('token');
          res.clearCookie('reftoken');
          res.send({url:'../'})
        });
    }
  },
];
