'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
const dns = require('dns');
const urlExists = require('url-exists')

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




const checkUrl = function(url) {
  
  if (url.slice(0,8) === 'https://' || url.slice(0,7) === 'http://') {
     return url
  } else if (url.slice(0,4) === 'www.') {
    return('https://' + url)
  } else {
    return ('https://www.' + url)
  }
}

app.post('/api/shorturl/new', async function (req, res) {
  
  let id = {};
  
  let url = checkUrl(req.body.url);
  
  
  urlExists(url, async function(err, exists) {
    if (exists) {
          
      let docCount = await Url.countDocuments({original: req.body.url});
  
      if (docCount === 0) {
        id.new = await makeShorty(req.body.url)
      } else {
        id = await searchShorty(req.body.url);
      }
      res.json({'original_url': req.body.url, 'short_url': id.new}) 
    } else {

      res.json({'error': 'invalid url'})
    }
  })
  
})

app.get('/api/shorturl/:num', async function(req, res) {
  
  let id = await searchLong(req.params.num)
 
  let newUrl = checkUrl(id.original)
  
  res.redirect(newUrl)
})

app.listen(port, function () {
  console.log('Node.js listening ...');
});