const express = require("express");
var app 	= express();
const bodyParser=require('body-parser');
const https=require('https');
const request = require('request');
const path = require("path");
const mongoose = require("mongoose");



app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static(path.join(__dirname, "static")));

var userSchema = new mongoose.Schema({
	username: String,
	email: String,
	password: String,
	data: [{
		date: Date,
		proteins: String,
		carbs: String,
		calories: String,
		Fat: String,
		Water: String
	}]
});

app.route('/')
	.get(function(req,res){
		res.render("landing.ejs")
		
	})
	
	.post(function(req,res){
		var url = "https://api.nutritionix.com/v1_1/search/" + req.body.food+"?fields=item_name,brand_name,item_id,nf_calories&appId=8b2f16ba&appKey=bf903319558c8e7bb3ab4db7687c868d"
		request(url,function(err, response, body){
			var parsedData = JSON.parse(body)
			res.redirect("/dashboard",{data: parsedData})
		})})




app.get("/dashboard",function(req,res){
	res.render("dashboard.ejs")
});

app.get("/details",function(req,res){
	res.render("details.ejs")
});


app.listen(process.env.PORT||3000, process.env.IP, function(){
	console.log("Food tracker server up and running on port 3000");
})