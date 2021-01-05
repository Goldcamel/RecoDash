var mongoose = require('mongoose');

var questionSchema = new mongoose.Schema({
    id: {type: Number, Required:  'Question must have its unique id', index: {unique: true, dropDups: true}},
    typeid: {type: Number, required: [true, 'Question must have a type id']},
    type: {type: String, required:  [true, 'Question must have a tag']},
    body: {type: String, required: [true, 'Question must have a body']},
    difficulty: {type: String, required: [true, 'Question must have a difficulty']},
    subdifficulty: {type: String, required: [true, 'Question must have a subdifficulty']},
    key: {type: String, required: [true, 'Question must have a key']}
});

module.exports = mongoose.model('Questions', questionSchema);