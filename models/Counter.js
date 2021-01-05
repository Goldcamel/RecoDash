var mongoose = require('mongoose');

var counterSchema = new mongoose.Schema({
    _id:            {type: String},
    sequence_value: {type: Number}
});

module.exports = mongoose.model('Counters', counterSchema);