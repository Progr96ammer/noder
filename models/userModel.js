//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var userModelSchema = new Schema({
  name: String,
  avatar: String,
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
  verification:Object,
});
// Compile model from schema
var users = mongoose.model('users', userModelSchema );

module.exports = users;
