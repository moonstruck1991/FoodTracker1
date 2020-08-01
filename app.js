require('dotenv').config();
const express = require("express");
var app 	= express();
const bodyParser=require('body-parser');
const https=require('https');
const request = require('request');
const path = require("path");
const bcrypt=require('bcrypt');
const saltRounds=10;
const passport = require("passport")
const localStrategy = require("passport-local")
const passportLocalMongoose = require("passport-local-mongoose")

const mongoose = require("mongoose");
var date=require('./date');

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static(path.join(__dirname, "static")));

mongoose.connect('mongodb://localhost:27017/Foodtracker', {useNewUrlParser: true,useUnifiedTopology:true});


var userSchema = new mongoose.Schema({
	username: String,
	email: String,
	password: String,
	currentDate: String,
	proteins: Number,
	carbs: Number,
	calories: Number,
	Fat: Number,
	datewise: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Datewise"
	}],
	data: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Food",
	}]
});

userSchema.plugin(passportLocalMongoose);

var dateSchema = new mongoose.Schema({
	date: String,
	
	proteins: Number,
	carbs: Number,
	calories: Number,
	Fat: Number,
})

var foodSchema = new mongoose.Schema({
	date: String,
	title: String,
	proteins: Number,
	carbs: Number,
	calories: Number,
	Fat: Number,
})

var Food = mongoose.model('Food', foodSchema)
var Datewise = mongoose.model('Datewise', dateSchema)

var User = mongoose.model('User', userSchema);

app.use(require("express-session")({
	secret: "Gaming and coding",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize())
app.use(passport.session())

passport.use(new localStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())




app.get("/",function(req,res){
	
	
			res.render("landing.ejs");
	
	
	
	})


// index routes

app.post("/signup",function(req, res){
	var user= {
					email:req.body.email,
					username: req.body.username,
					currentDate:  date.date(),
					proteins: 0,
					carbs:0,
					calories:0,
					Fat:  0,
					data:  [],
					datewise: []	
				};
	
	User.register(new User(user),req.body.password, function(err, createdUser){
		if(err){
			console.log(err)
			res.redirect("/")
		}else{
			console.log(createdUser)
			passport.authenticate("local")(req, res, function(){ 								res.redirect("/" + createdUser._id); })
		}
	})
	
});

app.post('/login',
  passport.authenticate('local', {failureRedirect: "/"}),
  function(req, res) {

    res.redirect('/' + req.user._id);
  });


app.get('/logout', function(req, res){
	req.logout();
	
  res.redirect('/');
});

// dashboard route

app.get("/:id",isLoggedIn,function(req,res){
		User.findById(req.params.id).populate('datewise').exec( function(err, user){
			if(err){
				console.log(err)
				res.redirect("back")
			}else{
				    if(user.currentDate === date.date()){
							res.render("dashboard.ejs",{user: user})
					}else{
							user.currentDate = date.date()
							user.proteins = 0
							user.carbs = 0
							user.calories = 0
							user.Fat = 0
							var datewise = {
							date : date.date(),
							proteins : 0,
							carbs : 0,
							calories : 0,
							Fat : 0 
							}
							Datewise.create(datewise,function(err, datewise){
								if(err){
									console.log(err)
									res.redirect("/osbnosnbs/bsbsbs/bsbsd")
								}else{
									user.datewise.push(datewise)
									if(user.datewise.length === 7)
										{
											user.datewise.shift()
										}
									user.save()
							res.render("dashboard.ejs",{user: user})
								}
							})
						
					}	
				
	
			}
		})

	
})

// details

app.get("/:id/details",isLoggedIn,function(req,res){

		User.findById(req.params.id).populate('data').exec(function(err, foundUser){
			if(err){
				console.log(err)
				res.render("back")
			}else{
				res.render("details.ejs",{user: foundUser})	
			}
		})
})


// adding Food

app.post("/:id",isLoggedIn,function(req,res){
	var url = "https://api.nutritionix.com/v1_1/search/"+ req.body.food +"?fields=item_name,brand_name,item_id,nf_calories,nf_total_fat,nf_protein,nf_total_carbohydrate&appId=8b2f16ba&appKey=bf903319558c8e7bb3ab4db7687c868d"
		User.findById(req.params.id,function(err, user){
			request(url,function(err, response, body){
			var parsedData = JSON.parse(body)
			
			var food = {

				date: date.date(),
				title: req.body.food,
				proteins: Math.floor(parsedData["hits"][0]["fields"]["nf_protein"]),
				carbs: Math.floor(parsedData["hits"][0]["fields"]["nf_total_carbohydrate"]),
				calories: Math.floor(parsedData["hits"][0]["fields"]["nf_calories"]),
				Fat: Math.floor(parsedData["hits"][0]["fields"]["nf_total_fat"]),
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
					Datewise.findOne({date: date.date()},function(err,datewise){
						console.log(datewise)
					datewise.proteins = datewise.proteins + parsedData["hits"][0]["fields"]["nf_protein"]
				
				datewise.calories = datewise.calories + parsedData["hits"][0]["fields"]["nf_calories"]
				datewise.Fat = datewise.Fat + parsedData["hits"][0]["fields"]["nf_total_fat"]
				datewise.carbs = datewise.carbs+ parsedData["hits"][0]["fields"]["nf_total_carbohydrate"]
					datewise.save()	
					
					user.data.push(food)
					user.save()
					console.log(user)
					res.redirect("/" + user._id)
					})
					
				}
			})
			
				
			})		
	})
})




// error handling route

app.get("*",function(req, res){
	res.render("error.ejs")
});


// middleware

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return	next()
	}
	res.redirect("/oaboaba/oanboanba/biana")
}
	
app.listen(3000||process.env.PORT,process.env.IP,function(){
	console.log('Server up and running on port 3000');
})
	
	
	
	
	
	