var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/*
 * userCart Schema
 */
var userCart = new Schema({
  userId: {
    type: String,
    required: [true, "User ID not provided "]
  },
  tokenId: {
    type: Number,
    required: [true, "Token ID not provided"]
  }
},
  {
    versionKey: false
  }
);

module.exports = mongoose.model('Cart', userCart); 