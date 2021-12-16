const path = require("path")
const fs = require("fs");
const express = require("express")
const app = express()

const bodyParser = require("body-parser")
app.use(bodyParser.json())
app.use(express.static("static"));

const multer = require("multer")
const upload = multer({ dest: path.join(__dirname, 'uploads')});

const Datastore = require("nedb")
const imagesDB = new Datastore({ filename: "db/images.db", autoload: true, timestampData: true })
const commentsDB = new Datastore({ filename: "db/comments.db", autoload: true, timestampData: true })

app.post("/api/images/", upload.single("picture"), function(req, res, next) {
    console.log(req.body)
    const { title, author, url } = req.body
    if (title === "" || author === "" || url === "") {
        res.status(400).json({message: "All fields required"})
    } else {
        let image = { title, author, url}
        console.log(image)
        imagesDB.insert(image, function(err, newImage) {
            // After insert, set the header and respond with the status
            res.setHeader("content-type", "application/json")
            res.status(200).json(newImage)
        })
    }
})

app.get("/api/images", function(req, res, next) {
    imagesDB.find({}, function(err, allImages) {
        res.setHeader("content-type", "application/json")
        res.json(allImages)
    })
})

app.get("/api/images/:imageId", function(req, res, next) {
    imagesDB.findOne({ _id: req.params.imageId }, function(err, image) {
        if (!image) {
            // Return error response
            res.setHeader("content-type", "application/json")
            res.status(404).json({message: "Image does not exist"})
        } else {
            res.setHeader("content-type", "application/json")
            res.status(200).json(image)
        }
    })
})

app.delete("/api/images/:imageId", function(req, res, next) {
    const imageID = req.params.imageId
    imagesDB.findOne({ _id: imageID }, function(err, image) {
        if (!image) {
            // Return error response
            res.setHeader("content-type", "application/json")
            res.status(404).json({message: "Image does not exist"})
        } else {
            // When an image is removed, also delete the image in the uploads folder
            imagesDB.remove({ "_id": imageID }, {}, function(err, numRemoved) {
                fs.unlink(path.join(__dirname, "uploads") + "/" + imageID, function(err) {
                    if (err) throw err
                })
                // Also, remove the comments associated with it
                commentsDB.remove({ imageId: imageID }, { multi: true }, function(err, numRemoved) {
                })
                res.setHeader("content-type", "application/json")
                res.json(image)
            })
        }
    })
})

const http = require("http");
const PORT = 3000;
http.createServer(app).listen(PORT, function(err) {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
