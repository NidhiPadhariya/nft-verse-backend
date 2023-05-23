var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/*
 * nft Schema
 */
var nftSchema = new Schema({
  userId: {
    type: String,
    require: true
  },
  roomId: {
    type: Number,
    // required: true
  },
  tokenId: {
    type: Number,
    // required: [true, "Token ID not provided"],
    // unique: true
  },
  tokenHash: {
    type: String,
    required: true
  },
  nftName: {
    type: String,
    required: true
  },
  nftDescritption: {
    type: String,
    required: true
  },
  nftImage: {
    type: String,
    required: true
  },
  nftCurrentPrice: {
    type: Number
  },
  nftLastsoldValue: {
    type: Number
  }
},
  {
    versionKey: false
  }
);

module.exports = mongoose.model('nftvr', nftSchema);