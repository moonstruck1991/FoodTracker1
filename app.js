require('dotenv').config();
const express = require("express");
var app 	= express();
const bodyParser=require('body-parser');
const https=require('https');
const request = require('request');
const path = require("path");
const bcrypt=require('bcrypt');
const saltRounds=10;
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
	data: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Food",
	}]
});


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

		User.findById(req.params.id).populate('data').exec(function(err, foundUser){
			if(err){
				console.log(err)
				res.render("back")
			}else{
				res.render("details.ejs",{user: foundUser})	
			}
		})
})
	

app.post("/signup",function(req, res){
	User.findOne({email:req.body.email},function(err,foundUser){
        if(err){
			console.log(err);
		}   
        else if(foundUser){
            res.send('This email is already registered.')
		}
		else{
			bcrypt.hash(req.body.password,saltRounds,function(err,hash){
				var user=new User({
					email:req.body.email,
					password:hash,
					currentDate:  date.date(),
					proteins: 0,
					carbs:0,
					calories:0,
					Fat:  0,
					data:  [],
					username: req.body.username
				});
				user.save(function(err){
					if(err)
						console.log(err);
					else    
					   res.redirect('/'+user._id);
				});
			});
		}
    });

	
});


app.post('/login',function(req,res){
	User.findOne({email:req.body.mail},function(err,foundUser){
        if(err)
            console.log(err);
        else if(foundUser){
            bcrypt.compare(req.body.assword,foundUser.password,function(err,response){
                if(err)
                    console.log(err);
                else if(response)
                    res.redirect('/'+foundUser._id);
                else 
                    res.send('Sorry, that password is incorrect.')
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
});
	
app.listen(3000||process.env.PORT,process.env.IP,function(){
	console.log('Server up and running on port 3000');
});
	
	
	
	
	
	