var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose"); 
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/unit18Populater", { useNewUrlParser: true });
// Connect to the Mongo DB / via heroku / external
//var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
//mongoose.connect(MONGODB_URI);
// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("http://www.echojs.com/latest/0").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("article h2").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
//          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
        });
    });

    // Send a message to the client
    res.send("Scrape Complete");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {       
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
       
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {       
      res.json(dbArticle);
    })
    .catch(function(err) {       
      res.json(err);
    });
});


// Route for delete a note 
app.post("/notes/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
   // db.Article.deleteOne(req.body)
    db.Note.deleteOne(req.body)
    .then(function(dbArticle) {         
        //return db.Article.findAllAndDelete({ _id: req.params.id }, { note: dbArticle._id }, { new: true });
        db.Note.deleteMany({ _id: req.params.id }, { note: dbArticle._id }, { new: true });
                
      })
      .then(function(dbArticle) {       
        res.json(dbArticle);
      })
      .catch(function(err) {       
        res.json(err);
      });
  });

// Route for delete an article 
app.post("/articles1/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Article.deleteOne(req.body)
  //db.Note.deleteOne(req.body)
   .then(function(dbArticle) {
     db.Article.deleteMany({ _id: req.params.id }, { note: dbArticle._id }, { new: true });              
    })
    .then(function(dbArticle) {       
      res.json(dbArticle);
    })
    .catch(function(err) {       
      res.json(err);
    }); 
});
 
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});