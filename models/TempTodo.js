var mongoose = require('mongoose');

var tempTodoSchema = new mongoose.Schema({

    questionid: {type: Number, required: [true, "question id must be provided"]},
    userid: {type: Number, required: [true, "user id must be provided"]},
    answer: {type: String}
});

module.exports = mongoose.model('TempTodoLists', tempTodoSchema);