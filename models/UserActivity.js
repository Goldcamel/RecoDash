var mongoose = require('mongoose');

var activitySchema = new mongoose.Schema({

    //id: {type: Number, required: [true, "id must be provided"]},
    userid: {type: Number, required: [true, "user id must be provided"]},
    levelProgress: {type: [{type: String}]},
    lastProgress: {type: [{type: String}]},
    totalCorrectNum: {type: Number},
    totalWrongNum: {type: Number},
    totalQuestionNum: {type: Number}
});

module.exports = mongoose.model('UserActivities', activitySchema);