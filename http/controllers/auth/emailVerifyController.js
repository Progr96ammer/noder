const nodemailer = require("nodemailer");
const pug = require('pug');
var jwt = require('jsonwebtoken');
var User = require('../../../models/userModel');
var Auth = require('../../middleware/authentication');

const sendEmailVerifyAgain = exports.sendEmailVerifyAgain = (req, res)=> {
  sendEmailVerify(req,res,Auth.Auth(req,res).user._id,function (){
    res.render('./auth/verify',{
      auth:Auth.Auth(req,res).Auth,
      sent:true,
    });
  });
}

const sendEmailVerify = exports.sendEmailVerify = (req,res,id,cb)=> {
  User.findById(id, function(err, user){
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
        html: pug.renderFile('./views/auth/emails/emailVerify.pug', {token:token,path:req.protocol+'://'+req.get('host')}),
      });
    }
    main().catch(console.error);
  });
  cb();
}


exports.verifyEmail = function(req, res) {
  var decoded = jwt.verify(req.query.token, process.env.SECRET_KEY);
    if (decoded) {
      User.updateOne({_id:decoded.id},{verifiedAt:Date()}, function(err){
        if (err) {
          res.render('./errors/error',{error:500,msg:"Server Error"});
        }
        res.redirect('/home');
      });
    }
    else{
      res.render('./errors/error',{error:408,msg:"Request Time Out"});
    }
};
