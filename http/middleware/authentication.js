var jwt = require('jsonwebtoken');
var User = require('../../models/userModel');
const NodeCache = require( "node-cache" );
const newCache = new NodeCache( { checkperiod: 1 } );

const attempt = exports.attempt = (id, res, time=3600000)=> {
	var token = jwt.sign({ id:id }, process.env.SECRET_KEY);
    res.cookie('token',token,{ maxAge: time, httpOnly: true });
};

const signJwt = exports.signJwt = (id)=> {
	var token = jwt.sign({ id:id }, process.env.SECRET_KEY);
    return token;
};

exports.routeAuth = [(req, res, next)=> {
		jwt.verify(req.cookies.token, process.env.SECRET_KEY, function(err, decoded) {
		  if (err) {
		  	res.render('./auth/login');
		  }
		  next();
		});
	},
];

const Auth = exports.Auth = (req) =>{
  var decoded = jwt.verify(req.cookies.token, process.env.SECRET_KEY);
  if (decoded) {
  	return {Auth:true,decoded:decoded};
  }
  else return false;
}

exports.checkAuth = (req) =>{
	if (req.cookies.token) {
	  var decoded = jwt.verify(req.cookies.token, process.env.SECRET_KEY);
	  if (decoded) {
	  	return true;
	  }
	}
  	else 
  		return false;
}


exports.checkEmailVerify = [(req, res, next)=> {
	if (req.cookies.token) {
	  var decoded = jwt.verify(req.cookies.token, process.env.SECRET_KEY);
	  if (decoded) {
	  	User.findById(decoded.id, function(err, user){
			if (err) {
			  res.render('./errors/error',{error:500,msg:"Server Error"});
			}
			if (!user.verifiedAt) {
				attempt(user._id,res);
				res.render('./auth/verify',{auth:Auth(req).Auth,user:user});
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
	    newCache.set(req.headers['x-forwarded-for'] || req.connection.remoteAddress, {attampts:0}, 3600);
	}
	if (newCache.get( req.headers['x-forwarded-for'] || req.connection.remoteAddress ).attampts < 7) {
    	newCache.set(req.headers['x-forwarded-for'] || req.connection.remoteAddress, {attampts:newCache.get( req.headers['x-forwarded-for'] || req.connection.remoteAddress ).attampts +1}, 3600);
    	next();
    }
    else{
    	res.send ({"errors": [{"value": "","msg": "You have reached the maximum number of attampting for one hour. please try again after one Hour.","param": "attampts","location": "body"}]});
    }
}