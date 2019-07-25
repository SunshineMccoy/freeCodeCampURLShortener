'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
const dns = require('dns');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI);
var Schema = mongoose.Schema;

var urlSchema = new Schema({
  original: String,
  new: Number
  
})

const Url = mongoose.model('Url', urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

const makeShorty =  async function (url) {

  let count = await Url.countDocuments({})

  let test = new Url({original: url, new: count});
  

  test.save();
  return count;
}

const searchShorty = async function(url) {
  let docs = await Url.findOne({original: url, new: {$gte: 0}});
  
  return docs
}

const searchLong = async function(id) {
  let doc = await Url.findOne({new: id});
  return doc;
}

app.post('/api/shorturl/new', async function (req, res) {
  
  let id = {};
  
  let filteredUrl = req.body.url;
  
  if (filteredUrl.slice(0,8) === 'https://' ) { 
    filteredUrl = filteredUrl.slice(8);
  } else if (filteredUrl.slice(0,7) === 'http://') {
    filteredUrl = filteredUrl.slice(7);
  }
  
  dns.lookup(filteredUrl, function(err, address) {
    if (err) {
      console.log(err)
      console.log('dns error ' + filteredUrl)
      res.json({'error': 'invalid url'})
    }
  }) 
  
  let docCount = await Url.countDocuments({original: req.body.url});
  
  if (docCount === 0) {
    id.new = await makeShorty(req.body.url)
  } else {
    id = await searchShorty(req.body.url);
  }
  

  res.json({'original_url': req.body.url, 'short_url': id.new})
})

app.get('/api/shorturl/:num', async function(req, res) {
  console.log(req.params)
  let id = await searchLong(req.params.num)
  res.redirect(id.original)
})

app.listen(port, function () {
  console.log('Node.js listening ...');
});