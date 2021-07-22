const { check, validationResult } = require('express-validator');
var Auth = require('../../middleware/authentication');
var User = require('../../../models/userModel');
var crypto = require('crypto');
var emailVerifyController = require('./emailVerifyController');

exports.registerForm = function(req, res, next) {
  if (!Auth.checkAuth(req)) {
    res.render('./auth/register');
  }
  return res.redirect('home');
};

exports.register = [
check('firstName')
.isLength({ min: 3 }).withMessage('Name Must Be At Least 3 Charecter')
.isLength({ max: 15 }).withMessage('Name Must Be At Most 15 Charecter'),

check('lastName')
.isLength({ min: 3 }).withMessage('Name Must Be At Least 3 Charecter')
.isLength({ max: 15 }).withMessage('Name Must Be At Most 15 Charecter'),

check('email')
.isEmail().withMessage('Email Must Be As Type Of Email')
.custom((value, {req}) => {
    return new Promise((resolve, reject) => {
      User.findOne({email:req.body.email}, function(err, user){
        if(err) {
          reject(new Error('Soory We Cann`t Complete Your Procedure Right Now!'))
        }
        if(Boolean(user)) {
          reject(new Error('E-mail already in use'))
        }
        resolve(true)
      });
    });
  }),

check('username')
.isLength({ max: 15 }).withMessage('Username Must Be At Most 15 Charecter')
.isLength({ min: 5 }).withMessage('Username Must Be At Least 5 Charecter')
.custom((value, {req}) => {
    return new Promise((resolve, reject) => {
      User.findOne({username:req.body.username}, function(err, user){
        if(err) {
          reject(new Error('Soory We Cann`t Complete Your Procedure Right Now!'))
        }
        if(Boolean(user)) {
          reject(new Error('Username already in use'))
        }
        resolve(true)
      });
    });
  }),

check('password')
.isLength({ min: 8 }).withMessage('Password Must Be At Least 8 Charecter'),

check('confirm-password')
.isLength({ min: 8 }).withMessage('Confirm Password Must Be At Least 8 Charecter')
.custom((value, { req }) => {
if (value !== req.body.password) {
  throw new Error('Password Didn`t Match!');
}
return true;
}),
(req, res, next)=> {
  const errors = validationResult(req);
    if (!errors.isEmpty()){
       res.send({errors: errors.array()});
    }
    else{
      const newUser = new User({
        firstName:req.body.firstName,
         lastName:req.body.lastName,
         email:req.body.email,
         username:req.body.username,
         password:crypto.createHash('md5').update(req.body.password).digest("hex"),
         verifiedAt:"",
        });
      newUser.save(function (err , saveRes) {
        if (err) {
          res.render('./errors/error',{error:500,msg:"Server Error"});
        }
        emailVerifyController.sendEmailVerify(req,newUser._id);
        Auth.attempt(newUser._id,res);
        res.redirect('home');
      });
    }
  },
];