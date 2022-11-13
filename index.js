const express=require('express');
const mongoose= require('mongoose');
const bodyparser=require('body-parser');
const cookieParser=require('cookie-parser');
const db=require('./config/config').get(process.env.NODE_ENV);
const app=express();
const User=require('./models/user');
const {auth}=require('./middlewares/auth');

app.use(bodyparser.urlencoded({extended : false}));
app.use(bodyparser.json());
app.use(cookieParser());
mongoose.Promise=global.Promise;
module.exports=mongoose.model('User',userSchema);
mongoose.connect(db.DATABASE,{useNewUrlParser:true,useUnifiedTopology:true},function(err){
  if(err) console.log(err);
  console.log("Database is connected");
});


app.get('/',function(req,res){
    res.status(200).send(`Welcome to login , sign-up api`);
});
const userSchema=mongoose.Schema({
  firstname:{
        type: String,
        required: true,
        maxlength: 100
    },
    lastname:{
        type: String,
        required: true,
        maxlength: 100
    },
    rollno:{
      type:Number,
      required:true,
      maxlength:30
    },
    year:{
      type:Number,
      required:true,
      maxlength:4
    },
    branch:{
      type:String,
      required:true,

    },
    mobno:{
      type:Number,
      maxlength:10,
    },
    email:{
        type: String,
        required: true,
        trim: true,
        unique: 1
    },
    password:{
        type:String,
        required: true,
        minlength:8
    },
    password2:{
        type:String,
        required: true,
        minlength:8

    },
    token:{
        type: String
    }
});
module.exports=mongoose.model('User',userSchema);
userSchema.pre('save',function(next){
  var user=this;
  if(user.isModified('password')){
    bcrypt.genSalt(salt,function(err,salt){
      if(err) return next(err);
      bcrypt.hash(user.password,salt,function(err,hash){
        if(err) return next(err);
        user.password=hash;
        user.password2=hash;
        next();
      })
   })
  }
  else{
    next();
  }
});
// adding new user (sign-up route)
app.post('/api/register',function(req,res){
   // taking a user
   const newuser=new User(req.body);

  if(newuser.password!=newuser.password2) return res.status(400).json({message: "password not match"});

   User.findOne({email:newuser.email},function(err,user){
       if(user) return res.status(400).json({ auth : false, message :"email exits"});

       newuser.save((err,doc)=>{
           if(err) {console.log(err);
               return res.status(400).json({ success : false});}
           res.status(200).json({
               success:true,
               user : doc
           });
       });
   });
});

// login user
app.post('/api/login', function(req,res){
    let token=req.cookies.auth;
    User.findByToken(token,(err,user)=>{
        if(err) return  res(err);
        if(user) return res.status(400).json({
            error :true,
            message:"You are already logged in"
        });

        else{
            User.findOne({'email':req.body.email},function(err,user){
                if(!user) return res.json({isAuth : false, message : ' Auth failed ,email not found'});

                user.comparepassword(req.body.password,(err,isMatch)=>{
                    if(!isMatch) return res.json({ isAuth : false,message : "password doesn't match"});

                user.generateToken((err,user)=>{
                    if(err) return res.status(400).send(err);
                    res.cookie('auth',user.token).json({
                        isAuth : true,
                        id : user._id
                        ,email : user.email
                    });
                });
            });
          });
        }
    });
});

// get logged in user
app.get('/api/profile',auth,function(req,res){
        res.json({
            isAuth: true,
            id: req.user._id,
            email: req.user.email,
            name: req.user.firstname + req.user.lastname

        })
});

//logout user
 app.get('/api/logout',auth,function(req,res){
        req.user.deleteToken(req.token,(err,user)=>{
            if(err) return res.status(400).send(err);
            res.sendStatus(200);
        });

    });





const PORT=process.env.PORT||3000;
app.listen(PORT,()=>{
    console.log(`app is live at ${PORT}`);
});
