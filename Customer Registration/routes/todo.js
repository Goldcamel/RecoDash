var express   = require('express');
var router    = express.Router();
var mongoose  = require('mongoose');
var TodoDB    = require("../models/TodoModel");
var QuesDB    = require("../models/Question");
var TemptodoDB = require("../models/TempTodo");
var Record    = require("../models/Record");
var UserActivityDB = require("../models/UserActivity");

var CN_TIME_OFFSET = +8;
const numLevel = 55;

/* GET profile page. */
router.get('/', async function(req, res, next) {
    
    var userid = req.session.userinfo.userid;
    var questionList = [];
    var items = [];

    const finishedQuestionSet = new Set();
    var finishedCnt = 0;

    await TemptodoDB.find({userid: userid}, function(err, queries){
        if(err) throw err;

        if(queries) {
            for(let i=0 ; i<queries.length ; i++) {
                finishedQuestionSet.add(queries[i].questionid);
            }

            finishedCnt = queries.length * 1.0;
        }
    });
/*
    await TodoDB.findOne({userid: userid}, async function(err, data){
        if(err) throw err;

        if(data) {
            questionList = data.questions;
            await QuesDB.find({id: {$in: questionList}}, async function(err, questions){
                if(err) throw err;
            
                if(questions) {
                    for(let i=0 ; i<questions.length ; i++) {
                        var checked = (finishedQuestionSet.has(questions[i].id))? "fa-check": "";
                
                        items.push({id: questions[i].id, 
                                    type: questions[i].type,
                                    difficulty: questions[i].difficulty,
                                    subdifficulty: questions[i].subdifficulty,
                                    checked: checked
                                });
                    }
                }

                var progress = (data && questions.length > 0)? finishedCnt / questions.length: 0;
                progress = Math.round((progress * 100));

                res.render('todo', { 
                    ITEMS: items,
                    progress: progress,
                    name: req.session.userinfo.name
                });
            });

        } else {
            res.render('todo', { 
                ITEMS: items,
                progress: 0,
                name: req.session.userinfo.name
            });
        }
    });
*/

// aggregate lookup 做两个库的联合查找
    await TodoDB.aggregate([{
        $match: {"userid": userid}
    }, {
        $lookup: {
            from: QuesDB.collection.name,
            localField: "questions",
            foreignField: "id",
            as: "questions"
        }
    }, {
        $limit: 1
    }], (err, data) => {
        if(err) throw err;
        
        if(data) {
            var questions = data[0].questions;
            for(let i=0 ; i<questions.length ; i++) {
                var checked = (finishedQuestionSet.has(questions[i].id))? "fa-check": "";
        
                items.push({
                    id: questions[i].id, 
                    type: questions[i].type,
                    difficulty: questions[i].difficulty,
                    subdifficulty: questions[i].subdifficulty,
                    checked: checked
                });
            }

            var progress = (data && questions.length > 0)? finishedCnt / questions.length: 0;
            progress = Math.round((progress * 100));

            res.render('todo', { 
                ITEMS: items,
                progress: progress,
                name: req.session.userinfo.name
            });
        } else {
            res.render('todo', { 
                ITEMS: items,
                progress: 0,
                name: req.session.userinfo.name
            });
        }
    });
})

router.post('/', async function(req, res, next){
    var userid = req.session.userinfo.userid;
    var today_date = new Date();
    today_date.setHours(today_date.getHours() + CN_TIME_OFFSET);
    var startDate = new Date(today_date);
    startDate.setUTCHours(0, 0, 0, 0);
    var endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);

    console.log(startDate);
    console.log(endDate);

    var questions = [];
    var answers = [];
    var scores = [];
    var question2key = new Map();
    var question2level = new Map();
    await TodoDB.findOne({userid: userid}, async function(err, data){
        /*
        *  get questionlist in todoDB
        * */
        if(err) throw err;

        if(data) {
            for(let i=0 ; i<data.questions.length ; i++) {
                questions.push(data.questions[i]);
            }

            answers = new Array(questions.length)
            answers.fill("")
            scores = new Array(questions.length)
            scores.fill(0)

            /*
            *  remember the key to every question in the memory
            * */
            await QuesDB.find({id: {$in: questions}}, function(err, doc){
                if(err) throw err;

                if(doc) {
                    for(let i=0 ; i<doc.length ; i++) {
                        question2key.set(doc[i].id, doc[i].key);
                        var indexAtLevel = (doc[i].difficulty.charCodeAt() - 'A'.charCodeAt()) * 5 + (doc[i].subdifficulty.charCodeAt() - '1'.charCodeAt());
                        question2level.set(doc[i].id, indexAtLevel);
                    }
                }
            });
        }
    });
    
    var total_score = 0;    
    var curtotalCorrectNum = 0;
    var curtotalQuestionNum = 0;

    await TemptodoDB.find({userid: userid}, async function(err, data){
        if(err) throw err;

        if(data) {

            for(let i=0 ; i<data.length ; i++){
                var questionid = data[i].questionid;
            
                var index = 0;
                while(index < questions.length && questionid != questions[index]) {
                    index++;
                }
        
                var answer = data[i].answer;
                answers[index] = answer;

                var key = question2key.get(questionid);
                var score = (key == answer)? 1: 0;

                if(key == answer) {
                    curtotalCorrectNum++;
                } 
        
                scores[index] = score;
                total_score += score;
            };

            curtotalQuestionNum = questions.length;

            await UserActivityDB.findOne({userid: userid}, (err, doc) => {
                if(err) throw err;

                if(doc) {
                    levelProgressStrs = doc.lastProgress;
                    levelProgressList = []
                    for(let i=0 ; i<levelProgressStrs.length ; i++) {
                        var progress = parseInt(levelProgressStrs[i]);
                        levelProgressList.push(progress)
                    }

                    for(let i=0 ; i<questions.length ; i++) {
                        var questionid = questions[i];
                        var answer = answers[i];
                        var levelIndex = question2level.get(questionid);

                        if(answer == question2key.get(questionid)) {
                            levelProgressList[levelIndex]++;

                            if(levelProgressList[levelIndex] == 20) {
                                if(levelProgressList[numLevel-1] == 0) {
                                    var idx = numLevel-1;
                                    while(idx > levelIndex && levelProgressList[idx-1] == 0) {
                                        idx--;
                                    }
                                    levelProgressList[idx] = 2;
                                }

                                levelProgressList[levelIndex] = 0;
                            }
                        } else {
                            if(levelProgressList[levelIndex] > 1) {
                                levelProgressList[levelIndex]--;
                            }
                        }
                    }

                    for(let i=0 ; i<levelProgressList.length ; i++) {
                        levelProgressStrs[i] = levelProgressList[i].toString();
                    }

                    var totalWrongNum = doc.totalWrongNum + curtotalQuestionNum - curtotalCorrectNum;
                    var totalCorrectNum = doc.totalCorrectNum + curtotalCorrectNum;
                    var totalQuestionNum = doc.totalQuestionNum + curtotalQuestionNum;

                    var activityDoc = {
                        levelProgress: levelProgressStrs,
                        totalCorrectNum: totalCorrectNum,
                        totalWrongNum: totalWrongNum,
                        totalQuestionNum: totalQuestionNum
                    };
                    
                    UserActivityDB.updateOne({userid: userid}, {$set: activityDoc}, {upsert: true}, function(error, result){
                        if(error) throw error;
                    });
                }
            });
        }

        var historyrecord = {
            userid: userid,
            date: today_date,
            questions: questions,
            answers: answers,
            scores: scores,
            total_score: total_score
        }; 
    
        Record.updateOne({userid: userid, date: { "$gte" : startDate, "$lt" : endDate }}, 
            {$set: historyrecord}, 
            {upsert: true}, function(err, doc){
            if(err) throw err;
        });
    });

    TemptodoDB.deleteMany({userid: userid}, function(err){
        if(err) throw err;
    });

    res.json({status: 'success'});
});

router.get('/:id', async function(req, res){
    var questionid = req.params.id;
    var userid = req.session.userinfo.userid;
    var answer = "";
 
    await TemptodoDB.findOne({userid: userid, questionid: questionid}, function(err, data){
        if(err) throw err;

        if(data && data.answer != undefined && data.answer != "") {
            answer = data.answer;
        }
    }); 
   
    await QuesDB.findOne({id: questionid}, (err, question) => {
        if (err) throw err;
        res.render(
            'todo-question', 
            {
                question_id: questionid, 
                question_body: question.body, 
                hint: "这是一个提示", 
                ANSWER: answer,
                name: req.session.userinfo.name
            }
        );
    });  
});

router.post('/:id', async (req, res) => {
    var questionid = req.params.id;
    var userid = req.session.userinfo.userid;
    var answer = req.body.answer;
    if(answer != "") {
        answer = answer.trim();
    }
    
    var temptodoitem = {
        answer: answer,
        userid: userid,
        questionid: questionid
    };
    TemptodoDB.updateOne({userid: userid, questionid: questionid}, {$set: temptodoitem}, {upsert: true}, function(err, doc){
        if(err) throw err;
    });

    var explain = "";
    await QuesDB.findOne({id: questionid}, async (err, question) => {
        if (err) throw err;

        if (question) {
            if (question.key == answer) {
                return;
            }
            await UserActivityDB.findOne({userid: userid}, (err, activity) => {
                var levelIdx = question.difficulty.charCodeAt() - 'A'.charCodeAt();
                var sublevelIdx = question.subdifficulty.charCodeAt() - '1'.charCodeAt();
                var levelNum = levelIdx * 5 + sublevelIdx;  
                console.log(activity.levelProgress[levelNum]);
                if (activity.lastProgress[levelNum] == "1") {
                    explain = question.key;
                }
            });
        }
    });

    var nextid = -1;
    await TodoDB.findOne({userid: userid}, async function(err, data){
        if(err) throw err;

        if(data) {
            var questionList = data.questions;
            for(let i=0 ; i<questionList.length-1 ; i++) {
                if(questionList[i] == req.body.currentid) {
                    nextid = questionList[i+1];
                    break;
                }
            }

            var message = (nextid == -1)? "": nextid;
            res.json({status: "success", message: message, explain: explain})
        
        } else {
            res.json({status: "success", message: "", explain: explain})
        } 
    });
    
});

module.exports = router;