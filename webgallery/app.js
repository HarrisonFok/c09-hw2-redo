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
    if (title === "" || author === "" || url === "") res.status(400).json({message: "All fields required"})    
    else {
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

// MISSING GET RAW PICTURE

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

app.post("/api/images/:imageId/comments", function(req, res, next) {
    console.log(req.body.imageId, req.body.content, req.body.author)
    const { imageId, content, author } = req.body
    if (author === "" || content === "") res.status(400).json({message: "All fields required"})
    else if (imageId !== req.params.imageId) res.status(400).json({message: "The ID in the URL doesn't match the one provided in the body"})
    else {
        imagesDB.findOne({ _id: imageId }, function(err, image) {
            if (!image) {
                res.setHeader("content-type", "application/json")
                res.status(404).json({ message: "Cannot add a comment to an image that doesn't exist" })
            } else {
                let comment = { imageId, content, author }
                console.log(comment)
                commentsDB.insert(comment, function(err, newComment) {
                    res.setHeader("content-type", "application/json")
                    res.json(newComment)
                })
            }
        })
    }
})

app.get("/api/images/:imageId/comments/:commentId", function(req, res, next) {
    imagesDB.findOne({ _id: req.params.imageId }, function(err, image) {
        if (!image) {
            res.setHeader("content-type", "application/json")
            res.status(404).json({ message: "Image does not exist" })
        } else {
            commentsDB.findOne({ _id: req.params.commentId }, function(err, comment) {
                if (!comment) {
                    res.setHeader("content-type", "application/json")
                    res.status(404).json({ message: "Comment does not exist" })
                } else {
                    res.setHeader("content-type", "application/json")
                    res.json(comment)
                }
            })
        }
    })
})

app.get("/api/images/:imageId/comments", function(req, res, next) {
    const imageID = req.params.imageId
    imagesDB.findOne({ _id: imageID }, function(err, image) {
        if (!image) {
            res.setHeader("content-type", "application/json")
            res.status(404).message({ message: "Image does not exist" })
        } else {
            commentsDB.find({ imageId: imageID }, function(err, comments) {
                res.setHeader("content-type", "application/json")
                res.json(comments)
            })
        }
    })
})

app.delete("/api/images/:imageId/comments/:commentId", function(req, res, next) {
    const { imageId, commentId } = req.params
    imagesDB.findOne({ _id: imageId }, function(err, image) {
        if (!image) {
            res.setHeader("content-type", "application/json")
            res.status(404).json({ message: "Image does not exist" })
        } else {
            commentsDB.findOne({ _id: commentId }, function(err, comment) {
                if (!comment) {
                    res.setHeader("content-type", "application/json")
                    res.status(404).json({ message: "Comment does not exist" })
                } else {
                    commentsDB.remove({ _id: commentId }, {}, function(err, numRemoved) {
                        if (numRemoved > 0) {
                            res.setHeader("content-type", "application/json")
                            res.json(comment)
                        }
                    })
                }
            })
        }
    })
})

const http = require("http");
const PORT = 3001;
http.createServer(app).listen(PORT, function(err) {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
