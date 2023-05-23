var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/*
 * nftRoom Schema
 */
var nftRoom = new Schema({
    roomNumber: {
        type: Number,
        required: true
    },
    roomName: {
        type: String,
        required: true
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


module.exports = mongoose.model('nftRoom', nftRoom); 