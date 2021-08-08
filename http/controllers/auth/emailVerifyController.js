const nodemailer = require("nodemailer");
const { check, validationResult } = require('express-validator');
const pug = require('pug');
var jwt = require('jsonwebtoken');
var User = require('../../../models/userModel');
var Auth = require('../../middleware/authentication');

const emailVerifyForm = exports.emailVerifyForm = (req, res)=> {
  res.render('./auth/verify',{
    auth:true,
    user:Auth.Auth(req,res).user,
    sent:req.query.sent,
  })
}

const sendEmailVerifyAgain = exports.sendEmailVerifyAgain = (req, res)=> {
  sendEmailVerify(req,res,Auth.Auth(req,res).user._id,function (){
    res.send({url:'emailVerifyForm?sent=true'})
  });
}

const sendEmailVerify = exports.sendEmailVerify = (req,res,id,cb)=> {
  var rand = Math.floor(Math.random()*899999+100000);
  User.findOneAndUpdate({_id:id},{$set:{'verification.email':{token: rand, date: Date()}}},{new:true}, function(err, user) {
    if (!user) {
      res.send({url:'/error?errnum=500&errmsg=Server Error'});
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
        subject: "Email Verication", // Subject line
        html: pug.renderFile('./views/auth/emails/emailVerify.pug', {token:rand}),
      });
    }
    main().catch(console.error);
  });
  cb()
}

exports.verifyEmail = [
  check('verificationCode')
      .notEmpty().withMessage('Verifycation code required!')
      .bail()
      .custom((value, {req}) => {
        return new Promise((resolve, reject) => {
          User.findById(Auth.Auth(req).user._id, function(err, user){
            if(err) {
              reject(new Error('Soory We Cann`t Complete Your Procedure Right Now!'))
            }
            else if(user.verification.email.token != value) {
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
      User.findById(Auth.Auth(req).user._id, function(err,user){
        if (err) {
          res.send({url:'/error?errnum=500&errmsg=Server Error'});
        }
        if (new Date(new Date(user.verification.email.date).setHours(new Date(user.verification.email.date).getHours() + 1)) >= new Date()){
          User.findOneAndUpdate({_id:Auth.Auth(req).user._id},{$set:{'verification.email':{token: 'verified', date: Date()}}},{new:true}, function(err,user) {
            if (err) {
              res.send({url:'/error?errnum=500&errmsg=Server Error'});
            }
            res.send({url:'/home',token:Auth.attempt(user,res,false,Auth.Auth(req).session)})
          }).select("-password").select("-verification.email.token").select("-verification.password.token");
        }
      });
    }
  }]
