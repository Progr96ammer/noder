var crypto = require('crypto');
const { check, validationResult } = require('express-validator');
var Auth = require('../../middleware/authentication');
var User = require('../../../models/userModel');

exports.profileForm = function(req, res, next) {
    res.render('auth/profile',{
        auth:true,
        user:Auth.Auth(req,res).user,
    });
};

exports.profile = [
check('name')
.isLength({ min: 3 }).withMessage('Name Must Be At Least 3 Charecter')
.isLength({ max: 15 }).withMessage('Name Must Be At Most 15 Charecter'),

check('username')
.isLength({ max: 15 }).withMessage('Username Must Be At Most 15 Charecter')
.isLength({ min: 5 }).withMessage('Username Must Be At Least 5 Charecter')
.bail()
.custom((value, {req}) => {
    return new Promise((resolve, reject) => {
      User.findById(Auth.Auth(req).user._id, function(err, user){
        if(err) {
          reject(new Error('Soory We Cann`t Complete Your Procedure Right Now!'))
        }
    	else if(user.username != value) {
    		User.findOne({username:value}, function(err, result){
    			if(err) {
		          	reject(new Error('Soory We Cann`t Complete Your Procedure Right Now!'))
		        }
    			if (result) {
    				reject(new Error('Username already in use'));
    			}
                else {
                    resolve(true);
                }
    		});
        }
        else {
            resolve(true);
        }
      });
    });
  }),

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
      User.findOneAndUpdate({_id:Auth.Auth(req).user._id},{name:req.body.name,username:req.body.username}, {new: true}, function(err, user){
      	if (err) {
            res.render('./errors/error',{error:500,msg:"Server Error"});
      	}
      	console.log(user)
          res.send({url:'profile',token:Auth.attempt(user,res,false,Auth.Auth(req).session)})
      });
    }
  },
];
