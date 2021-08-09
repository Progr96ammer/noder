var jwt = require('jsonwebtoken');
var User = require('../../models/userModel');
const NodeCache = require( "node-cache" );
const newCache = new NodeCache( { checkperiod: 1 } );
const crypto = require('crypto');

const getHttpToken = exports.getHttpToken=(req,res)=>{
	if(Object.keys(req.cookies).length != 0){
		var httpToken = req.cookies;
		return httpToken
	}
	else if(req.headers['x-access-token']){
		var httpToken = JSON.parse(req.headers['x-access-token']).token;
		return httpToken
	}
	else{
		return 'false'
	}
}

const reqType = exports.reqType=(req,res)=>{
	if(Object.keys(req.cookies).length != 0){
		return 'browser'
	}
	else if(req.headers['x-access-token']){
		return 'api'
	}
}

const attempt = exports.attempt = (user, res,firstAttampt=true,hashRand='')=> {
	if (firstAttampt){
		var hashRand = crypto.randomBytes(8).toString('hex');
		var session = 'sessions.'+hashRand;
		User.updateOne({_id:user._id},{$set:{[session]:{date:new Date()}}}, function(err){
			if (err) {
				res.send('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!');
			}
		});
	}
	var token = jwt.sign({ user:user,session:hashRand }, process.env.SECRET_KEY, {expiresIn:1800000});
	var reftoken = jwt.sign({ user:user,session:hashRand }, process.env.SECRET_KEY, {expiresIn:2592000});
    res.cookie('token',token,{ maxAge: 2592000000, httpOnly: true });
	res.cookie('reftoken',reftoken,{ maxAge: 2592000000, httpOnly: true });
	return {token:token,reftoken:reftoken}
};

exports.routeAuth = [(req, res, next)=> {
	if (!getHttpToken(req,res).reftoken) {
		if (reqType(req)=='api'){
			res.send('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!');
		}
		res.render('./auth/login')
	}
	jwt.verify(getHttpToken(req,res).token,process.env.SECRET_KEY, function(err, decoded) {
		if (err) {
			jwt.verify(getHttpToken(req,res).reftoken, process.env.SECRET_KEY, function(err, decoded) {
				if (err) {
					if (reqType(req)=='api'){
						res.send('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!');
					}
					res.render('./auth/login')
				}
				attempt(decoded.user,res,false,decoded.session);
			})
		}
		next();
	});
}];

const Auth = exports.Auth = (req,res) =>{
	var decoded = jwt.verify(getHttpToken(req,res).reftoken, process.env.SECRET_KEY)
		if (decoded) {
			return {Auth:true,user:decoded.user,session:decoded.session};
		}
		if (reqType(req)=='api'){
			res.send('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!');
		}
	res.render('./auth/login')
}

exports.checkAuth = (req,res) =>{
	if (getHttpToken(req,res).reftoken) {
		var decoded = jwt.verify(getHttpToken(req,res).reftoken, process.env.SECRET_KEY)
		if (decoded) {
			return true;
		}
	}
	return false;
}


exports.checkEmailVerify = [(req, res, next)=> {
	if (getHttpToken(req,res).reftoken) {
		var decoded = jwt.verify(getHttpToken(req,res).reftoken, process.env.SECRET_KEY);
		if (decoded) {
			User.findById(decoded.user._id, function(err, user){
				if (err) {
					if (reqType(req)=='api'){
						res.send('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!');
					}
					res.render('./auth/login')
				}
				if (user.verification.email.token != 'verified') {
					if (reqType(req)=='api'){
						res.send({url:'user/emailVerifyForm'});
					}
					res.redirect('user/emailVerifyForm');
				}
				if(!user.sessions[decoded.session]){
					if (reqType(req)=='api'){
						res.send('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!');
					}
					res.render('./auth/login')
				}
				next();
			});
		}
	}
	else{
		if (reqType(req)=='api'){
			res.send('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!');
		}
		res.render('./auth/login')
	}
}];

const rateLimiter = exports.rateLimiter = (req, res, next) =>{
	if (!newCache.get( req.headers['x-forwarded-for'] || req.connection.remoteAddress )) {
		newCache.set(req.headers['x-forwarded-for'] || req.connection.remoteAddress, {attempts:0}, 60);
	}
	if (newCache.get( req.headers['x-forwarded-for'] || req.connection.remoteAddress ).attempts < 7) {
		newCache.set(req.headers['x-forwarded-for'] || req.connection.remoteAddress, {attempts:newCache.get( req.headers['x-forwarded-for'] || req.connection.remoteAddress ).attempts +1}, 60);
		next();
	}
	else{
		res.send ({"errors": [{"value": "","msg": "You have reached the maximum number of failed attampting for one hour. please try again after one Hour.","param": "attempts","location": "body"}]});
	}
}
