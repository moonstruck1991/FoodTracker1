//jshint esversion:6

require('dotenv').config();
const express = require("express");
var app 	= express();
const bodyParser=require('body-parser');
const https=require('https');
const request = require('request');
const path = require("path");
const mongoose = require("mongoose");
const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose');
var session=require('express-session');
var date=require('./date');
console.log(date.date());

app.use(session({
    secret: "Foodtracker is made by me and Kanu",
    resave:false,
    saveUninitialized:false            
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static(path.join(__dirname, "static")));

mongoose.connect('mongodb://localhost:27017/Foodtracker', {useNewUrlParser: true,useUnifiedTopology:true});
mongoose.set('useCreateIndex',true);

var userSchema = new mongoose.Schema({
	username: String,
	email: String,
	password: String,
	currentDate: String,
	proteins: Number,
	carbs: Number,
	calories: Number,
	Fat: Number,
	data: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Food",
	}]
});

userSchema.plugin(passportLocalMongoose);

var foodSchema = new mongoose.Schema({
	date: String,
	title: String,
	proteins: Number,
	carbs: Number,
	calories: Number,
	Fat: Number,
})

var Food = mongoose.model('Food', foodSchema)
var User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req,res){
		res.render("landing.ejs");
	})


app.get("/:id",function(req,res){

	if(req.isAuthenticated()){
		User.findById(req.params.id, function(err, user){
			if(err){
				console.log(err)
				res.redirect("back")
			}else{
	
				res.render("dashboard.ejs",{user: user})
	
			}
		})
	}else{
		res.redirect('/landing.ejs');
	}

	
})

app.get("/:id/details",function(req,res){

	if(req.isAuthenticated())
     {
		User.findById(req.params.id).populate(data).exec(function(err, foundUser){
			if(err){
				console.log(err)
				res.render("back")
			}else{
				res.render("details.ejs",{user: foundUser})	
			}
		})
	 }   
    else{
        res.redirect('/landing.ejs');
    }

	
	
	
	
})

app.post("/signup",function(req, res){
	var user = {username: req.body.username,
			   email: req.body.email,
			   }
		
		user.currentDate = date.date();
		user.proteins= 0;
		user.carbs=0;
		user.calories=0;
		user.Fat = 0;
		user.data = [];

	
	// User.create(user, function(err, createdUser){
		console.log(user)
	// 		res.redirect("/" + createdUser._id)

	// });

	User.register(user,req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect('/');
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/" + user._id);
            });
        }
    });
});

app.post("/login",function(req,res){
	var user=new User({
        email:req.body.email,
        password:req.body.password
    });

    req.login(user,function(err){
        if(err)
            console.log(err)
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/" + user._id);
            });
        }
    });
});

app.post("/:id",function(req,res){
	var url = "https://api.nutritionix.com/v1_1/search/"+ req.body.food +"?fields=item_name,brand_name,item_id,nf_calories,nf_total_fat,nf_protein,nf_total_carbohydrate&appId=8b2f16ba&appKey=bf903319558c8e7bb3ab4db7687c868d"
		User.findById(req.params.id,function(err, user){
			request(url,function(err, response, body){
			var parsedData = JSON.parse(body)
			
			var food = {

				date: date.date(),
				title: req.body.food,
				proteins: parsedData["hits"][0]["fields"]["nf_protein"],
				carbs: parsedData["hits"][0]["fields"]["nf_total_carbohydrate"],
				calories: parsedData["hits"][0]["fields"]["nf_calories"],
				Fat: parsedData["hits"][0]["fields"]["nf_total_fat"],
			}
			
			Food.create(food,function(err,food){
				if(err){
					console.log(err)
					res.redirect("back")
				}else{
					user.proteins = user.proteins + parsedData["hits"][0]["fields"]["nf_protein"]
				
				user.calories = user.calories + parsedData["hits"][0]["fields"]["nf_calories"]
				user.Fat = user.Fat + parsedData["hits"][0]["fields"]["nf_total_fat"]
				user.carbs = user.carbs+ parsedData["hits"][0]["fields"]["nf_total_carbohydrate"]
					user.data.push(food)
					user.save()
					console.log(user)
					res.redirect("/" + user._id)
				}
			})
			// if(user.date = today){
				
				
			// }
	// 		user.data.push({
	// 			date: today,
	// 			proteins: parsedData["hits"][0]["fields"]["nf_protein"],
	// 			carbs: parsedData["hits"][0]["fields"]["nf_total_carbohydrate"],
	// 			calories: parsedData["hits"][0]["fields"]["nf_calories"],
	// 			Fat: parsedData["hits"][0]["fields"]["nf_total_fat"]
	// })
				
				
			})		
	})
})

app.get("*",function(req, res){
	res.render("error.ejs")
})
	

app.listen(process.env.PORT||3000, process.env.IP, function(){
	console.log("Food tracker server has started on local port 3000");

})


