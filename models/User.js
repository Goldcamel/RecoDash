var mongoose = require('mongoose');

var validateEmail = function(email) {
    var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email)
};

var userSchema = new mongoose.Schema({

  id: {type: Number, required: 'ID must be provided', index: {unique: true, dropDups: true}},

  full_name: { type: String,  required: [true, 'Full name must be provided'] },

  email:    { 
    
    type: String,     

    Required:  'Email address cannot be left blank.',
    validate: [validateEmail, 'Please fill a valid email address'],
         match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    index: {unique: true, dropDups: true}
    },

  password: { 
    type: String , 
    required: [true,  'Password cannot be left blank'],
    set(val) {
      // 密码加密
      return require('bcrypt').hashSync(val, 10);
    }

    },

  dob: { type: Date , required: [true, 'Date of birth must be provided']},

  province: { type: String , required: [true, 'Province cannot be left blank.']},

  rank: {type:     Number , required: [true, 'Rank must be provided']},

  gender: { type: String , required: [true, 'Gender must be provided']}

});

module.exports = mongoose.model('Users', userSchema);