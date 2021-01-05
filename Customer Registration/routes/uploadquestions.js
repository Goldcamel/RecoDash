var express   = require('express');
var router    = express.Router();
var User      = require("../models/User");

/* GET profile page. */
router.get('/', async function(req, res, next) {
    res.render('uploadquestions', {
        name: req.session.userinfo.name
    });
})
  
/* POST profile page. */ 
router.post('/', async function(req, res, next) {
    var username = req.session.userinfo.username;
    var userid = req.session.userinfo.userid;
    var body = req.body.body;
    var type = req.body.type;
    var answer = req.body.answer;
    var difficulty = req.body.difficulty;
    var subdifficulty = req.body.subdifficulty;
    var hint = req.body.hint;
    var explain = req.body.explain;


    
    res.send({
        message: '更改成功', 
        status: 'success'
    });
});

module.exports = router;
