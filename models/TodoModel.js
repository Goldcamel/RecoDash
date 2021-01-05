var mongoose = require('mongoose');

var todoSchema = new mongoose.Schema({

    //id: {type: Number, required: [true, "id must be provided"]},
    userid: {type: Number, required: [true, "user id must be provided"]},
    questions: {type: [{type: Number}]}
});

module.exports = mongoose.model('TodoLists', todoSchema);