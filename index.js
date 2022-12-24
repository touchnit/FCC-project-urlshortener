require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');

// Connect mongoDB from Atlas
mongoose.connect(process.env.MONGO_CONNECT, { useNewUrlParser: true, useUnifiedTopology: true });


// Create document schema
let UrlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number }
});

// Create model constructor
let ShortenedUrl = mongoose.model('ShortenedUrl', UrlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

// Create URL validator
const isValidUrl = (urlString) => {
  let url;
  try {
    url = new URL(urlString);
  }
  catch (e) {
    return false;
  }
  return true;
}

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

app.post('/api/shorturl/', function (req, res) {
  let longUrl = req.body.url; // stores the input
  // First test if data is valid URL
  let postValidUrl = isValidUrl(longUrl);
  if (postValidUrl) {
    // Then find is URL already exists in database 
    ShortenedUrl.findOne({ original_url: longUrl }, function (err, data) {
      if (err) return console.error(err);

      // if not, retrieve lastId in database and create new mongoDB document
      if (!data) {
        let lastId = 0;
        ShortenedUrl.findOne().sort({ short_url: -1 }).exec(function (err, data) {
          if (err) return console.error(err);
          if (!data) lastId = 0;
          else {
            console.log("the last id in the database is :" + data.short_url)
            lastId = parseInt(data.short_url) + 1;
            console.log(lastId);
          }
          console.log(typeof lastId + " " + lastId)

          let newShortenedUrl = new ShortenedUrl({ original_url: longUrl, short_url: lastId })

          newShortenedUrl.save(function (err, data) {
            if (err) return console.error(err);
            console.log("saved successfully as shortId: " + newShortenedUrl.short_url)
            res.json(newShortenedUrl)
            return
          })
        })
      }

      // if it does, return mongoDB document and short_url
      else {
        console.log("found it !")
        res.json(data)
      };
    })


  } else { // post input is not a valid url
    res.json({ "error": "Invalid URL" })
  }

})