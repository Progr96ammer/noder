var crypto = require('crypto');
const { check, validationResult } = require('express-validator');
var Auth = require('../../middleware/authentication');
var User = require('../../../models/userModel');

exports.loginForm = function(req, res, next) {
  if (!Auth.checkAuth(req,res)) {
    res.render('auth/login');
  }
  return res.redirect('/home');
};


exports.login = [
check('credential')
.notEmpty().withMessage('E-Mail/Username Required!')
.bail()
.custom((value, {req}) => {
    return new Promise((resolve, reject) => {
      User.findOne({$or:[{email: value},{username: value}]}, function(err, user){
        if(err) {
          reject(new Error('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!'))
        }
        if(!user) {
          reject(new Error('This E-Mail/Username Is Not Registred!'))
        }
        resolve(true)
      });
    });
  }),

check('password')
.notEmpty().withMessage('Password Required!')
.bail()
.isLength({ min: 8 }).withMessage('Password Must Be At Least 8 Charecter')
.bail()
.custom((value, {req}) => {
    return new Promise((resolve, reject) => {
      if (req.body.credential) {
        User.findOne({$or:[{email: req.body.credential},{username: req.body.credential}]}, function(err, user){
          if(err) {
            reject(new Error('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!'))
          }
          if(!user) {
            reject(new Error('Incorrect Password!'))
          }
          else if(crypto.createHash('md5').update(value).digest("hex")!== user.password) {
            reject(new Error('Incorrect Password!'))
          }
          resolve(true)
        });
      }
      else{
        reject(new Error('Incorrect Password!'))
      }
    });
  }),
(req, res, next)=> {
  const errors = validationResult(req);
    if (!errors.isEmpty()){
       res.send({errors: errors.array()});
    }
    else{
      User.findOne({$or:[{email: req.body.credential},{username: req.body.credential}]}, function(err, user){
        if (err || !user) {
          res.send('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!');
        }
        res.send({url:'/home',token:Auth.attempt(user,res)})
      }).select("-password").select("-verification.email.token").select("-verification.password.token");
    }
  },
];
