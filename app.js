const express = require("express");
var app 	= express();
const bodyParser=require('body-parser');
const https=require('https');
const request = require('request');
const path = require("path");
const mongoose = require("mongoose");






app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static(path.join(__dirname, "static")));


mongoose.connect('mongodb://localhost:27017/Foodtracker', {useNewUrlParser: true});

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

var foodSchema = new mongoose.Schema({
	date: String,
	proteins: Number,
	carbs: Number,
	calories: Number,
	Fat: Number,
})

var Food = mongoose.model('Food', foodSchema)
var User = mongoose.model('User', userSchema);
app.get("/",function(req,res){
		res.render("landing.ejs");
		
	})
	



app.get("/:id",function(req,res){
	User.findById(req.params.id, function(err, user){
		if(err){
			console.log(err)
			res.redirect("back")
		}else{

			res.render("dashboard.ejs",{user: user})

		
			
		}
	})
})

app.get("/:id/details",function(req,res){
	User.findById(req.params.id,function(err, foundUser){
		if(err){
			console.log(err)
			res.render("back")
		}else{
			res.render("details.ejs",{user: foundUser})	
		}
	})
	
	
})

app.post("/signup",function(req, res){
	var user = {username: req.body.username,
			   email: req.body.email,
			   password: req.body.password}
		var today = new Date();
			var dd = String(today.getDate()).padStart(2, '0');
			var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
			var yyyy = today.getFullYear();
			today = mm + '/' + dd + '/' + yyyy;
		user.currentDate = today
		user.proteins= 0
		user.carbs=0
		user.calories=0
		user.Fat = 0
		user.data = []

	
	User.create(user, function(err, createdUser){
		console.log(createdUser)
			res.redirect("/" + createdUser._id)

	})
			

})


app.post("/:id",function(req,res){
	var url = "https://api.nutritionix.com/v1_1/search/"+ req.body.food +"?fields=item_name,brand_name,item_id,nf_calories,nf_total_fat,nf_protein,nf_total_carbohydrate&appId=8b2f16ba&appKey=bf903319558c8e7bb3ab4db7687c868d"
		User.findById(req.params.id,function(err, user){
			request(url,function(err, response, body){
			var parsedData = JSON.parse(body)
				var today = new Date();
			var dd = String(today.getDate()).padStart(2, '0');
			var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
			var yyyy = today.getFullYear();
			today = mm + '/' + dd + '/' + yyyy;
			var food = {
				date: today,
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
	console.log("Food tracker server has started")

})


