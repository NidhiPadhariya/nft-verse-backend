var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/*
 * userCart Schema
 */
var nftPrice = new Schema({
    seller: {
        type: String,
    },
    buyer: {
        type: String,
        default: ""
    },
    tokenId: {
        type: Number,
        required: [true, "Token ID not provided"]
    },
    nftPrice: {
        type: Number,
        require: [true, "Set NFT price"]
    },
    Date: {
        type: Date,
        default: Date.now
    }
},
    {
        versionKey: false
    }
);


module.exports = mongoose.model('nftPrice', nftPrice); 