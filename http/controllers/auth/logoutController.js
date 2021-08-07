var jwt = require('jsonwebtoken');
var User = require('../../../models/userModel');
var Auth = require('../../middleware/authentication');
exports.logout = function(req, res) {
    var session = 'sessions.'+Auth.Auth(req,res).session;
    User.updateOne({_id:Auth.Auth(req,res).user._id},{ $unset: {[session]:''}}, function(err){
        if (err) {
            res.render('error',{errnum:500,errmsg:"Server Error"});
        }
    });
    res.clearCookie('token');
    res.clearCookie('reftoken');
    res.send({url:'/'})
};
