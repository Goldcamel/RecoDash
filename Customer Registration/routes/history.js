var express   = require('express');
var router    = express.Router();
var UserDB    = require("../models/User");
var RecordDB  = require("../models/Record");
var QuesDB    = require("../models/Question");
var CN_TIME_OFFSET = +8;

/* GET history page. */
router.get('/', async function(req, res, next) {
    var userid = req.session.userinfo.userid;

    var total_score = 0;

    var year_record;

    var today_date = new Date();
    today_date.setHours(today_date.getHours() + CN_TIME_OFFSET);
    today_date.setUTCHours(0, 0, 0, 0);
    console.log(today_date);

    var startDate = new Date(today_date);
    var endDate = new Date(today_date);
    endDate.setDate(startDate.getDate() + 1);

    await RecordDB.findOne({userid: userid, date: { "$gte" : startDate
    , "$lt" : endDate }}, async (err, rec) => {

        if (err) throw err;
        if (!rec) return;
        
        total_score = rec.total_score;
        
    });

    var oneDayTime = 24*60*60*1000 ;
    var nowTime = today_date.getTime();
    var nowDay = today_date.getDay();
    var nextSundayTime = nowTime + (7 - nowDay) * oneDayTime;
    startDate = new Date(nextSundayTime - 7*53*oneDayTime);

    await RecordDB.find({userid: userid, date: { "$gte" : startDate
    , "$lt" : endDate }}, async (err, recs) => {

        if (err) throw err;
        if (!recs) return;
        year_record = recs;

    });

    var day_records = [];

    if (year_record) {
        for (const day_record of year_record) {
            day_records.push({
                "date": day_record.date.setHours(day_record.date.getHours() + CN_TIME_OFFSET),
                "count": day_record.total_score
            });
        }
    }

    res.render('history', {
        HISTORY_TODAY_DATE: today_date.toISOString().replace(/T.+/, ''),
        TOTAL_SCORE: total_score,
        data: JSON.stringify(day_records),
        name: req.session.userinfo.name
    });
});

router.post('/', async function(req, res, next){
    var input_date = req.body.date;

    var userid = req.session.userinfo.userid;

    var startDate = new Date(input_date);
    var endDate = new Date(input_date);
    endDate.setDate(startDate.getDate() + 1);

    var total_score = 0;

    await RecordDB.findOne({userid: userid, date: { "$gte" : startDate
    , "$lt" : endDate }}, async (err, rec) => {

        if (err) throw err;

        if(rec) {
            total_score = rec.total_score;
        }

        res.send({total_score: total_score});
    }); 
});

router.post('/data', async(req, res) => {
    var input_date = req.body.date;
    var userid = req.session.userinfo.userid;
    var startDate = new Date(input_date);
    var endDate = new Date(input_date);
    endDate.setDate(startDate.getDate() + 1);


    console.log(startDate);
    console.log(endDate);
    
    var items = [];
    var total_score = 0;

    await RecordDB.findOne({userid: userid, date: { "$gte" : startDate
    , "$lt" : endDate }}, async (err, rec) => {

        if (err) throw err;
        if (!rec) {
            return res.send({data: items, recordsFiltered: items.length, recordsTotal: items.length});
        }

        var questionList = rec.questions;
        var answerList = rec.answers;
        var scoreList = rec.scores;
        total_score = rec.total_score;
        var i = 0;

        for (const q of questionList) {
            await QuesDB.findOne({id: q}, (err, question) => {
                if (err) throw err;

                var item = {
                    "id": question.id, 
                    "type": question.type,
                    "difficulty": question.difficulty,
                    "subdifficulty": question.subdifficulty,
                    "answer": answerList[i],
                    "score": scoreList[i]
                };
                items.push(item);
                i++;
            });
        }
        console.log(items);
        res.send({data: items, recordsFiltered: items.length, recordsTotal: items.length});
    });
});

router.get('/:date/:id', async(req, res) => {
    var date = req.params.date;
    var id = req.params.id;
    var startDate = new Date(date);
    var endDate = new Date(date);
    endDate.setDate(startDate.getDate() + 1);

    await RecordDB.findOne({userid: req.session.userinfo.userid, date: { "$gte" : startDate
    , "$lt" : endDate }}, async (err, rec) => {

        if (err) throw err;
        var answer = findQuestionAnswer(rec, id);

        await QuesDB.findOne({id: id}, (err, question) => {
            if (err) throw err;
            res.render('question_view', {question_id: question.id, 
                                        question_body: question.body, 
                                        question_answer: answer, 
                                        name: req.session.userinfo.name});
        }); 

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