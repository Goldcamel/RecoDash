var express   = require('express');
var router    = express.Router();
var question  = require('../models/Question');
var record    = require('../models/Record');

router.get('/', async (req, res) => {
    console.log("OK");
    await question.find((err, questions) => {
        if (err) throw err;

        res.render('questions', {questions: questions,
                                name: req.session.userinfo.name});
    })
});

router.get('/:id', async (req, res) => {
    await question.findOne({id: req.params.id}, (err, question) => {
        if (err) throw err;
        res.render('question', {question_id: question.id, 
                                question_body: question.body, 
                                key: question.key,
                                name: req.session.userinfo.name});
    });  
});

router.get('/:id/view', async (req, res) => {
    await record.findOne({userid: req.session.userinfo.userid, date: { "$gte" : new Date(2016,1,24,0,0,0)
    , "$lt" : new Date(2016,1,25,0,0,0) }}, async (err, rec) => {

        if (err) throw err;
        var answer = findQuestionAnswer(rec, req.params.id);

        await question.findOne({id: req.params.id}, (err, question) => {
            if (err) throw err;
            res.render('question_view', {question_id: question.id, 
                                        question_body: question.body, 
                                        question_answer: answer, 
                                        name: req.session.userinfo.name});
        });

    });  
});

router.get('/:id/edit', async (req, res) => {
    await question.findOne({id: req.params.id}, (err, question) => {
        if (err) throw err;
        res.render('question_edit', {question_id: question.id, question_body: question.body, key: question.key});
    });  
});

function findQuestionAnswer(rec, id) {
    for (var i = 0; i < rec.questions.length; i++) {
        if (rec.questions[i] == id) {
            return rec.answers[i];
        }
    }
    return null;
}

module.exports = router;
