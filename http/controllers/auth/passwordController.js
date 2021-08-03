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

exports.sendResetPassword = [
check('credential')
.custom((value, {req}) => {
  return new Promise((resolve, reject) => {
    User.findOne({$or:[{email: req.body.credential},{username: req.body.credential}]}, function(err, user){
      if(err) {
        reject(new Error('Soory We Cann`t Complete Your Procedure Right Now!'))
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
      User.findOne({$or:[{email: req.body.credential},{username: req.body.credential}]}, function(err, user){
        if (!user) {
          res.render('./errors/error',{error:500,msg:"Server Error"});
        }
        var token = jwt.sign({ id:user._id,date:Date()}, process.env.SECRET_KEY, { expiresIn: 60*60 });
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
            subject: "Email Verication", // Subject line
            html: pug.renderFile('./views/auth/emails/resetPassword.pug', {token:token,path:req.protocol+'://'+req.get('host')}),
          });
          res.send({url:'sendResetPassword?sent=true'})
        }
        main().catch(console.error);
      });
    }
}];



exports.resetPasswordForm = function(req, res) {
  if (req.query.token) {
    var decoded = jwt.verify(req.query.token, process.env.SECRET_KEY);
      if (decoded) {
        res.render('./auth/reset',{token:req.query.token});
      }
      else{
        res.render('./errors/error',{error:408,msg:"Request Time Out"});
      }
  }
};


exports.resetPassword = [
check('newPassword')
.isLength({ min: 8 }).withMessage('Password Must Be At Least 8 Charecter'),

check('confirmPassword')
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
      if (!req.body.token) {
        res.render('./errors/error',{error:401,msg:"Unauthorized"});
      }
      else{
        var decoded = jwt.verify(req.body.token, process.env.SECRET_KEY);
        if (decoded) {
          User.findOneAndUpdate({_id:decoded.id},{password:crypto.createHash('md5').update(req.body.newPassword).digest("hex")},{new:true}, function(err,user){
            if (err) {
              res.render('./errors/error',{error:500,msg:"Server Error"});
            }
            res.send({url:'/home',token:Auth.attempt(user,res)})
          });
        }
        else{
          res.render('./errors/error',{error:401,msg:"Unauthorized"});
        }
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
  check('newPassword')
      .isLength({ min: 8 }).withMessage('Password Must Be At Least 8 Charecter'),

  check('confirmPassword')
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
      User.updateOne({_id:Auth.Auth(req).user._id},{password:crypto.createHash('md5').update(req.body.newPassword).digest("hex")}, function(err){
        if (err) {
          res.render('./errors/error',{error:500,msg:"Server Error"});
        }
      });
    res.send({url:'profile'})
  }]
