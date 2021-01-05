var express   = require('express');
var router    = express.Router();
var Record    = require("../models/Record");
var UserActivityDB = require("../models/UserActivity");

router.get('/', async (req, res)=> {

    var userid = req.session.userinfo.userid;
    var progress_data = [];
    var progress_detaildata = [];

    await UserActivityDB.findOne({userid: userid}, (err, query) => {
        if(err) throw err;

        var next_level_str = "A0";
        var current_level = "A";
        var totalcnt = 0;
        var correct_cnt = 0;
        var wrong_cnt = 0;
        var acc = 0;

        if(query) {
            levelProgress = (query.lastProgress == undefined || query.lastProgress.length == 0)? query.levelProgress: query.lastProgress;
            totalcnt = query.totalQuestionNum;
            correct_cnt = query.totalCorrectNum;
            wrong_cnt = query.totalWrongNum;
            acc = (totalcnt > 0)? correct_cnt * 100.0 / totalcnt: 0;
            acc = acc.toFixed(2);

            var num = 0;
            var maximumnum = 0;
            for(let i=0 ; i<levelProgress.length ; i++) {
                var progressInt = parseInt(levelProgress[i]);
                num += progressInt;

                progress_detaildata.push(progressInt);

                if((i+1) % 5 == 0) {
                    if(num >= maximumnum) {
                        maximumnum = num;
                        current_level = String.fromCharCode((i+1)/5 - 1 + 'A'.charCodeAt());
                    }

                    progress_data.push(num);
                    num = 0;
                }
            }

            var next_level = 0;
            for(let i=levelProgress.length-1 ; i>=0 ; i--) {
                if(levelProgress[i] != "0") {
                    next_level = i+1;
                    break;
                } 
            }

            if(next_level == levelProgress.length) {
                next_level = levelProgress.length - 1;
            }

            var remainder = next_level % 5;
            var dividen = Math.floor(next_level / 5);

            next_level_str = String.fromCharCode(dividen + 'A'.charCodeAt()) + String.fromCharCode(remainder + '1'.charCodeAt());
        }
       
        res.render('homepage', {
            title: "个人主页", 
            username: req.session.userinfo.username,
            name: req.session.userinfo.name,
            TOTAL_FINISHED_AMOUNT: totalcnt,
            EXEC_DAY_AMOUNT: next_level_str,
            ACCURACY: acc,
            CURRENT_LEVEL: current_level,
            CORRECT_AMOUNT: correct_cnt,
            WRONG_AMOUNT: wrong_cnt,
            progress_data: progress_data,
            progress_detaildata: progress_detaildata
        });
    });
});

router.get('/evaluate', (req, res) => {
    res.render('evaluate', {title: "个人测评", questions: [{id: 1, type: "鸡兔同笼", difficulty: "A", subdifficulty: "1"}]});
})

router.get('/logout', (req, res)=> {
    req.session.userinfo = null;
    res.redirect('/');
});

module.exports = router;