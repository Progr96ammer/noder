var jwt = require('jsonwebtoken');
var User = require('../../../models/userModel');
var Auth = require('../../middleware/authentication');
exports.logout = function(req, res) {
    var session = 'sessions.'+Auth.Auth(req,res).session;
    User.findOneAndUpdate({_id:Auth.Auth(req,res).user._id},{ $unset: {[session]:''}}, function(err,user){
        if (err || !user) {
            res.send('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!');
        }
    });
    res.clearCookie('token');
    res.clearCookie('reftoken');
    res.send({url:'/'})
};
