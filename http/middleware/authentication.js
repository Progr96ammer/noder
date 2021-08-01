var jwt = require('jsonwebtoken');
var User = require('../../models/userModel');
const NodeCache = require( "node-cache" );
const newCache = new NodeCache( { checkperiod: 1 } );
const crypto = require('crypto');

const attempt = exports.attempt = (user, res,firstAttampt=true,hashRand='')=> {
	if (firstAttampt){
		var hashRand = crypto.randomBytes(8).toString('hex');
		var session = 'sessions.'+hashRand;
		User.updateOne({_id:user._id},{$set:{[session]:{date:new Date()}}}, function(err){
			if (err) {
				res.render('./auth/login');
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
	if (!req.cookies.reftoken) {
		res.render('./auth/login')
	}
	jwt.verify(req.cookies.token,process.env.SECRET_KEY, function(err, decoded) {
		if (err) {
			jwt.verify(req.cookies.reftoken, process.env.SECRET_KEY, function(err, decoded) {
				if (err) {
					res.render('./auth/login');
				}
				attempt(decoded.user,res,false,decoded.session);
			})
		}
		next();
	});
}
];

const Auth = exports.Auth = (req,res) =>{
		var decoded = jwt.verify(req.cookies.reftoken, process.env.SECRET_KEY)
			if (decoded) {
				return {Auth:true,user:decoded.user,session:decoded.session};
			}
	res.render('./auth/login');
}

exports.checkAuth = (req,res) =>{
	if (req.cookies.reftoken) {
		var decoded = jwt.verify(req.cookies.reftoken, process.env.SECRET_KEY)
		if (decoded) {
			return true;
		}
	}
	return false;
}


exports.checkEmailVerify = [(req, res, next)=> {
	if (req.cookies.reftoken) {
		var decoded = jwt.verify(req.cookies.reftoken, process.env.SECRET_KEY);
		if (decoded) {
			User.findById(decoded.user._id, function(err, user){
				if (err) {
					res.render('./auth/login');
				}
				if (!user.verifiedAt) {
					res.render('./auth/verify',{auth:Auth(req).Auth,user:user});
				}
				if(!user.sessions[decoded.session]){
					res.render('index');
				}
				next();
			});
		}
	}
	else
		return false;
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
		res.send ({"errors": [{"value": "","msg": "You have reached the maximum number of attampting for one hour. please try again after one Hour.","param": "attempts","location": "body"}]});
	}
}
