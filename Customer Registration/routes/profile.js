var express   = require('express');
var router    = express.Router();
var mongoose  = require('mongoose');
var bcrypt    = require('bcrypt');
var User      = require("../models/User");
const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize }   = require('express-validator/filter');
const SECRET_KEY = 'key_that_shouldnot_appear_here';

/* GET profile page. */
router.get('/', async function(req, res, next) {
    
    var username = req.session.userinfo.username;
    const user = await User.findOne({email: username});
    var gender = (user.gender == 'Male')? '男': '女';

    res.render('profile', { 
        title: 'Profile Page', 
        default_profile_fullname:   user.full_name,
        default_profile_email:      user.email,
        default_profile_dob:        user.dob.toISOString().replace(/T.+/, ''),
        default_profile_province:   user.province,
        default_profile_gender:     gender,
        name: req.session.userinfo.name
    });
})
  
/* POST profile page. */ 
router.post('/', [

    check('name', '姓名不能为空！').isLength({ min: 1 }),
    check('email')
    .isEmail().withMessage('请输入正确的电子邮件地址！')
    .trim()
    .normalizeEmail(),

    check('gender','请选择性别！').isLength({ min: 1 }),
    check('dob','请选择出生日期！').isLength({ min: 1 }),
    check('province','请选择省份！').isLength({ min: 1 }),

    ], async function(req, res, next) {

        if(!req.session.userinfo) {
            return res.json({status : "error", message: 'no record in session'});
        }

      
        const errors = validationResult(req);
        if (!errors.isEmpty()) {     
            return res.json({status: "checkerror", message : errors.array()});
        } 
        
        const user = await User.findOne({email: req.session.userinfo.username})
        var current_email = user.email;
        
        var mystatus = 200;
        var mymessage = "更改成功";
        await User.findOne({ email: req.body.email }, function(err, doc){
            if (err) {
                mystatus = 404;
                mymessage = err;
            }
            if (doc && (req.body.email != current_email)) {
                mystatus = 404;
            }        
        });

        if(mystatus == 404) {
            return res.json({status: "error", message: ["该邮箱已经被注册，请输入其他的邮箱地址。"]});
        }

        user.full_name  = req.body.name;
        user.email      = req.body.email;
        user.dob        = req.body.dob;
        user.province   = req.body.province;
        user.gender     = req.body.gender;

        user.save();    
        res.send({message: '更改成功', status: 'success'});
});

/* POST profile page. */ 
router.put('/', async function(req, res, next) {

        if(!req.session.userinfo) {
            return res.json({status : "error", message: 'no record in session'});
        }

        if(!req.body.newpassword.match(/\d/)) {
            return res.send({
                statue: "error",
                message: "密码至少需要包含一位数字!"
            });
        }
        
        const user = await User.findOne({email: req.session.userinfo.username}, function(err, doc) {
            if (err) throw err;
    
            if (!doc) {
                return res.send({
                    status: 'error',
                    message: '连接超时'
                });
            } 
        });

        if(!bcrypt.compareSync(req.body.oldpassword, user.password)) {
            return res.send({
                status: 'error',
                message: '密码错误'
            });
        } 

        user.password = req.body.newpassword;

        user.save(function(error){
            if(error){ 
                throw error;
            }
            
            res.json({message : "修改成功", status : "success"});
        });           
});

module.exports = router;
