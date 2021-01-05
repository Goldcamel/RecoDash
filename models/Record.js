var mongoose = require('mongoose');

var recordSchema = new mongoose.Schema({

    // id: {type: Number, required: [true, "record id must be provided"]},
    userid: {type: Number, required: [true, "user id must be provided"]},
    date: {type: Date, required: [true, "date must be provided"], index: {unique: true, dropDups: true}},
    questions: {type: [{type: Number}]},
    answers: {type: [{type: String}]},
    scores: {type: [{type: Number}]},
    total_score: {type: Number, required: [true, "total score must be provided"]}
});

module.exports = mongoose.model('Records', recordSchema);