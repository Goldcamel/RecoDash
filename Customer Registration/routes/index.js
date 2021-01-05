var express   = require('express');
var router    = express.Router();
var mongoose  = require('mongoose');
var bcrypt    = require('bcrypt');
var User      = require("../models/User");
var counter   = require("../models/Counter");
var UserActivity = require("../models/UserActivity");
var QuesDB    = require("../models/Question");
var ToDoDB    = require("../models/TodoModel");
const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize }   = require('express-validator/filter');
const SECRET_KEY = 'key_that_shouldnot_appear_here';

const ageToLevel = new Map([
  [6, 'A'],
  [7, 'C'],
  [8, 'D'],
  [9, 'F'],
  [10, 'G'],
  [11, 'I'],
  [12, 'K']
]);

const rankToSublevel = new Map([
  [1, '5'],
  [2, '5'],
  [3, '4'],
  [4, '4'],
  [5, '3'],
  [6, '3'],
  [7, '2'],
  [8, '2'],
  [9, '1'],
  [10, '1']
]);

const diffLevel = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
const subDiffLevel = ['1', '2', '3', '4', '5']
const numOfLevel = diffLevel.length * subDiffLevel.length
const initScale = [16, 14, 12, 10, 8, 6, 4, 2, 2, 2]

/* GET login page. */
router.get('/', function(req, res, next) {
  res.render('login', { title: 'Home Page'});
})

/* POST login page. */ 
router.post('/', [

  check('username','姓名不能为空！').isLength({ min: 1 }),
  check('password').isLength({ min: 5 }).withMessage('密码不能少于五位！')
  .matches(/\d/).withMessage('密码至少需要包含一位数字！')

  ], async function(req, res, next){
    
    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
      res.json({status : "checkerror", message : errors.array()});

    } else {
      await User.findOne({email: req.body.username}, function(err, user) {
        if (err) {
            throw err;
        }

        if (!user)
        {
            return res.json({status: "error", message: "用户名不存在"});
        }
        if (!bcrypt.compareSync(req.body.password, user.password)) {
          return res.send({
            status: 'error',  
            message: '密码错误'
          });
        } else {
          req.session.userinfo = {
              username: req.body.username,
              userid: user.id,
              name: user.full_name
          };
          console.log(user.full_name);
          res.json({username: user.email});
        }
      });
    }  
});

/* GET user registration page. */
router.get('/register', function(req, res, next) {
  res.render('register', { title: 'Registration Page'});
  });   

  
/* POST user registration page. */
router.post('/register',[ 
  
  check('name','姓名不能为空！')
  .isLength({ min: 1 }),
  
  check('email')
  .isEmail().withMessage('请输入正确的电子邮件地址！')
  .trim()
  .normalizeEmail()
  .custom(value => {
      return findUserByEmail(value).then(User => {
        //if user email already exists throw an error
    })
  }),

  check('password')
  .isLength({ min: 5 }).withMessage('密码不能少于五位！')
  .matches(/\d/).withMessage('密码至少需要包含一位数字！')
  .custom((value,{req, loc, path}) => {
    if (value !== req.body.cpassword) {
        // throw error if passwords do not match
        throw new Error("两次输入的密码不匹配！");
    } else {
        return value;
    }
}),

check('gender','请选择性别！')
  .isLength({ min: 1 }),

  check('dob','请选择出生日期！')
  .isLength({ min: 1 }),
  
  check('province','请选择省份！')
  .isLength({ min: 1 }),

  check('rank','请选择班级排名！')
  .isLength({ min: 1 }),
  
  check('terms','请先阅读并同意法律条款！').equals('yes'),

  ], async function(req, res, next) {

    const errors = validationResult(req);

  if (!errors.isEmpty()) {     
      res.json({status : "error", message : errors.array()});

  } else {
      
    var id = null;
      
    await counter.findOne({_id: "userid"}, (err, count) => {
        if (err) throw err;
        id = count.sequence_value;

        console.log("user id: " + id);

        var document = {
            id:          id,
            full_name:   req.body.name, 
            email:       req.body.email, 
            password:    req.body.password, 
            dob:         req.body.dob, 
            province:    req.body.province, 
            rank:        req.body.rank,
            gender:      req.body.gender, 
            };
        
        var user = new User(document); 
        user.save(function(error){

            if(error){ 
            throw error;
            }

            counter.findOneAndUpdate(
            {_id: "userid"},

            {
                $inc:{sequence_value:1},
            }, (err) => {
                if (err) throw err;
                console.log("OK");
            });  
            
            res.json({message : "Data saved successfully.", status : "success"});
        });
    });

      var birthTime = new Date(req.body.dob).getTime();
      var nowTime = new Date().getTime();
      const msPerYear = 31536000000;

      var age = Math.ceil((nowTime-birthTime) / msPerYear);

      var level = 'A';
      if (age >= 6 && age <= 12) {
        level = ageToLevel.get(age);
      } else if (age > 12) {
        level = 'K';
      }

      var sublevel = rankToSublevel.get(parseInt(req.body.rank));

      // Estimate a level for a new user and initialize the levelProgressStrList for him
      var estimatedLevel = level + sublevel;
      var estimatedLevelNum = (level.charCodeAt() - 'A'.charCodeAt()) * subDiffLevel.length + (sublevel.charCodeAt() - '1'.charCodeAt());
      var levelProgressStrList = [];

      for (var i = 0; i < numOfLevel; i++) {
        levelProgressStrList.push('0');
      }

      var index = 0;
      var todoDiffList = [];

      for (var i = estimatedLevelNum - 5; i < estimatedLevelNum + 5; i++) {
        if (i >= 0 && i <= numOfLevel) {
          levelProgressStrList[i] = initScale[index].toString();
          todoDiffList.push(i);
        }
        index++;
      }

      console.log(estimatedLevel);
      console.log(estimatedLevelNum);
      console.log(levelProgressStrList);
      console.log("userid: " + String(id));

      var activityDoc = {
        userid: id,
        levelProgress: levelProgressStrList,
        lastProgress: levelProgressStrList,
        totalCorrectNum: 0,
        totalWrongNum: 0,
        totalQuestionNum: 0
      };

      var userActivity = new UserActivity(activityDoc);

      userActivity.save((err) => {
        if (err) throw err;
        console.log("Initialize user activity data successfully");
      });

      // Generate evalutation questions for new users
      var todoQuestionList = [];

      for (const todoDiffLevel of todoDiffList) {
        var llevel = todoDiffLevel / subDiffLevel.length;
        var dlevel = todoDiffLevel % subDiffLevel.length;
        var llevelStr = String.fromCharCode(llevel + 'A'.charCodeAt());
        var dlevelStr = String.fromCharCode(dlevel + '1'.charCodeAt());
        console.log(llevelStr + dlevelStr);

        await QuesDB.find({difficulty: llevelStr, subdifficulty: dlevelStr}, (err, questions) => {
            if (err) throw err;
            if (questions) {
              var ids = [];
              for (var j = 0; j < questions.length; j++) {
                ids.push(questions[j].id);
              }
              
              var numOfQues = Math.floor((20 - levelProgressStrList[todoDiffLevel]) / 4);
              var selectedIds = getRandomElements(ids,  (numOfQues == 0) ? 1 :  numOfQues);
              Array.prototype.push.apply(todoQuestionList, selectedIds);
            }
        });
      }

      todoQuestionList.sort((a, b) => {return a - b});
      console.log(todoQuestionList);

      var todoDoc = {
        userid: id,
        questions: todoQuestionList
      };

      var userTodo = new ToDoDB(todoDoc);
      userTodo.save((err) => {
        if (err) throw err;
        console.log("Generate todo list for the new user successfully");
      })
  }
});

router.get('/questions', (req, res) => {
  res.render('questions');
});

function findUserByEmail(email){

  if(email){
      return new Promise((resolve, reject) => {
        User.findOne({ email: email })
          .exec((err, doc) => {
            if (err) return reject(err)
            if (doc) return reject(new Error('该邮箱已经被注册，请输入其他的邮箱地址！'))
            else return resolve(email)
          })
      })
    }
 }

 function getRandomElements(arr, count) {
   var shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
   while (i-- > min) {
     index = Math.floor((i + 1) * Math.random());
     temp = shuffled[index];
     shuffled[index] = shuffled[i];
     shuffled[i] = temp;
   }

   return shuffled.slice(min);
 }

module.exports = router;