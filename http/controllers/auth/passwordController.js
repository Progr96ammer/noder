const { check, validationResult } = require('express-validator');
const nodemailer = require("nodemailer");
const pug = require('pug');
var User = require('../../../models/userModel');
var jwt = require('jsonwebtoken');
var Auth = require('../../middleware/authentication');
var crypto = require('crypto');

exports.sendResetPasswordForm = function(req, res) {
  if (Auth.checkAuth(req)){
    res.redirect('/home')
  }
  res.render('auth/resetPassword',{
    sent:req.query.sent,
  })
};

exports.confirmResetPasswordForm = function(req, res) {
  res.render('auth/confirmResetPasswordCode',{
    credential:req.query.credential.toLowerCase(),
    again:req.query.again,
  })
};

exports.sendResetPassword = [
check('credential')
.notEmpty().withMessage('E-Mail/Username Required!')
.bail()
.custom((value, {req}) => {
  return new Promise((resolve, reject) => {
    User.findOne({$or:[{email: req.body.credential.toLowerCase()},{username: req.body.credential.toLowerCase()}]}, function(err, user){
      if(err) {
        reject(new Error('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!'))
      }
      if(!Boolean(user)) {
        reject(new Error('This E-Mail/Username Is Not Registred!'))
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
      var rand = Math.floor(Math.random()*899999+100000);
      User.findOneAndUpdate({$or:[{email: req.body.credential.toLowerCase()},{username: req.body.credential.toLowerCase()}]},{$set:{'verification.password':{token: rand, date: Date()}}}, function(err, user){
        if (err || !user) {
          res.send('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!');
        }
        // async..await is not allowed in global scope, must use a wrapper
        async function main() {
          // Generate test SMTP service account from ethereal.email
          // Only needed if you don't have a real mail account for testing
          let testAccount = await nodemailer.createTestAccount();

          // create reusable transporter object using the default SMTP transport
          let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            // secure: process.env., // true for 465, false for other ports
            auth: {
              user: process.env.SMTP_USERNAME, // generated ethereal user
              pass: process.env.SMTP_PASSWORD, // generated ethereal password
            },
          });

          // send mail with defined transport object
          let info = await transporter.sendMail({
            from: process.env.FROM, // sender address
            to: user.email, // list of receivers
            subject: "Password Reset", // Subject line
            html: pug.renderFile('./views/auth/emails/resetPassword.pug', {token:rand}),
          });
          var again;
          if (req.body.again){
            res.send({url:'confirmResetPasswordForm?credential='+req.body.credential.toLowerCase()+'&again='+req.body.again+''})
          }
          res.send({url:'confirmResetPasswordForm?credential='+req.body.credential.toLowerCase()+''})
        }
        main().catch(console.error);
      });
    }
}];

exports.confirmResetPassword = [
  check('verificationCode')
      .notEmpty().withMessage('Verifycation code required!')
      .bail()
      .custom((value, {req}) => {
        return new Promise((resolve, reject) => {
          User.findOne({$or:[{email: req.body.credential.toLowerCase()},{username: req.body.credential.toLowerCase()}]}, function(err, user){
            if(err || !user) {
              reject(new Error('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!'))
            }
            else if(user.verification.password.token != value) {
              reject(new Error('Incorrect Code!'))
            }
            else if (new Date(new Date(user.verification.password.date).setHours(new Date(user.verification.password.date).getHours() + 1)) <= new Date()){
              reject(new Error('Code expired!'))
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
        User.findOne({$or:[{email: req.body.credential.toLowerCase()},{username: req.body.credential.toLowerCase()}]}, function(err,user) {
          if (err) {
            res.send('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!');
          }
          res.send({url:'resetpassword/email?credential='+req.body.credential.toLowerCase()+''})
        });
    }
  }]



exports.resetPasswordForm = function(req, res) {
  if (req.query.credential) {
    res.render('./auth/reset',{credential:req.query.credential.toLowerCase()});
  }
};


exports.resetPassword = [
check('newPassword')
.notEmpty().withMessage('New Password required!')
.bail()
.isLength({ min: 8 }).withMessage('Password Must Be At Least 8 Charecter'),

check('confirmPassword')
.notEmpty().withMessage('Confirm Password required!')
.bail()
.custom((value, { req }) => {
if (value !== req.body.newPassword) {
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
      if (!req.body.credential) {
        res.send('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!');
      }
      else{
        User.findOneAndUpdate({$or:[{email: req.body.credential.toLowerCase()},{username: req.body.credential.toLowerCase()}]},{password:crypto.createHash('md5').update(req.body.newPassword).digest("hex"),$unset:{'verification.password':''}},{new:true}, function(err,user){
          if (err || !user) {
            res.send('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!');
          }
          res.send({url:'/home',token:Auth.attempt(user,res)})
        }).select("-password").select("-verification.email.token").select("-verification.password.token");
      }
    }
}]

exports.updatePasswordForm = function(req, res) {
  res.render('auth/updatePassword',{
    auth:true,
    user:Auth.Auth(req,res).user,
  });
};

exports.updatePassword = [
  check('currentPassword')
      .notEmpty().withMessage('Current Password required!')
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
  check('newPassword')
      .notEmpty().withMessage('New Password required!')
      .bail()
      .isLength({ min: 8 }).withMessage('Password Must Be At Least 8 Charecter'),

  check('confirmPassword')
      .notEmpty().withMessage('Confirm Password required!')
      .bail()
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Password Didn`t Match!');
        }
        return true;
      }),
  (req, res, next)=> {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
      res.send({errors: errors.array()});
    }
      else {
        User.updateOne({_id:Auth.Auth(req).user._id},{password:crypto.createHash('md5').update(req.body.newPassword).digest("hex")}, function(err){
          if (err) {
            res.send('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!');
          }
        });
        res.send({url:'profile'})
    }
  }]
