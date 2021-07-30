//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var userModelSchema = new Schema({
  firstName: String,
  lastName: String,
  sessions: Object,
  email:{
  	required: true,
  	type:String,
  	unique: true
  },
  username:{
    required: true,
    type:String,
    unique: true
  },
  password: String,
  verifiedAt:{
  	type:Date,
  	sparse: true
  },
});
// Compile model from schema
var users = mongoose.model('users', userModelSchema );

module.exports = users;
