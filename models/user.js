var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/*
 * User Schema
 */
var userSchema = new Schema({
  userId: {
    type: String
  },
  isAdmin: {
    type: Boolean,
    required: true
  },
  userName: {
    type: String,
    required: [true, "user name not provided "],
    unique: true
  },
  password: {
    type: String,
    required: true
  },
},
  {
    versionKey: false
  }
);

module.exports = mongoose.model('User', userSchema); 