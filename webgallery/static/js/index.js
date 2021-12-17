(function() {
    "use strict"
    window.onload = function() {
        let uploadImageDivClassList = document.getElementsByClassName("toggleHiddenElmts");
        let uploadImageDiv = document.getElementsByClassName("toggleHiddenElmts")
        let currImgID = 1
        let currImgOffset = 0
        let currCommPage = 0
        let commentsForm = document.querySelector(".commentsForm");
        let imagesDiv = document.querySelector(".images")
        let commentsDiv = document.querySelector(".comments")
        let images
        // api.initImages()

        api.getAllImages(function(error, response) {
            // console.log(response)
            images = response

            putCurrImg()

            // Add a new image
            let submitImgButton = document.getElementById("submitImgBtn")
            submitImgButton.addEventListener("click", function(event) {
                event.preventDefault()
                let imageTitle = document.getElementById("imageTitle").value
                let imageAuthor = document.getElementById("imageAuthor").value
                let imageURL = document.getElementById("imageURL").value
                if (imageTitle != "" && imageAuthor != "" && imageURL != "") {
                    api.addImage(imageTitle, imageAuthor, imageURL, function(err, res) {
                        document.querySelector(".createImgForm").reset()
                        api.getAllImages(function(err, res) {
                            images = res
                            currImgOffset = images.length - 1;
                            // put up image
                            putCurrImg()
                        })
                    })
                }
            })

            // Put up image
            function putCurrImg() {
                if (images.length === 0) {
                    imagesDiv.innerHTML = `<p class="center">No images to show</p>`
                    commentsDiv.innerHTML = ""
                    commentsForm.setAttribute("hidden", true)
                } else {
                    // Show comments form
                    commentsForm.removeAttribute("hidden")
                    // Put up the image
                    let currImg = images[currImgOffset]
                    console.log(currImg)
                    if (!currImg) return
                    imagesDiv.innerHTML = `
                        <div>
                        <img src="${currImg.url}" />
                        </div>
                        <div>
                            <div>Title: ${currImg.title}</div>
                            <div>Author: ${currImg.author}</div>
                            <div>Date: ${currImg.date}</div>
                            <button class="deleteImageBtn" imageID="${currImg.imageID}">DELETE</button>
                            <button class="prevImageBtn" imageID="${currImg.imageID}">PREV</button>
                            <button class="nextImageBtn" imageID="${currImg.imageID}">NEXT</button>
                        </div>
                    `

                    // Add delete button
                    let deleteBtn = document.querySelector(".deleteImageBtn")
                    deleteBtn.addEventListener("click", function(event) {
                        event.preventDefault()
                        console.log(event.target)
                        // event.target is the delete button
                        let imageID = event.target.getAttribute("imageID")
                        console.log(imageID)
                        console.log(typeof(imageID))
                        api.deleteImage(parseInt(imageID))
                        console.log("After API delete call")
                        currImgOffset--;
                        if (currImgOffset < 0) currImgOffset = 0;
                        putCurrImg()
                    })

                    // Add the prev button
                    let prevBtn = document.querySelector(".prevImageBtn")
                    prevBtn.addEventListener("click", function(event) {
                        event.preventDefault()
                        currImgOffset--
                        if (currImgOffset < 0) currImgOffset = 0;
                        putCurrImg()
                    })

                    // Add the next button
                    let nextBtn = document.querySelector(".nextImageBtn")
                    nextBtn.addEventListener("click", function(event) {
                        event.preventDefault()
                        currImgOffset++
                        putCurrImg()
                    })

                    api.getComments(currImg._id, currCommPage, function(paginatedComments) {
                        let currentComments = paginatedComments
                        commentsDiv.innerHTML = ""
                        if (currentComments !== null)
                            if (currentComments.length > 0) putComments(currentComments)
                    })

                    currImgID = currImg._id
                }
            }
        })

        // Toggle elements
        let hideImageFormBtn = document.getElementById("hideImageFormBtn")
        hideImageFormBtn.addEventListener("click", function(event) {
            for (let i=0; i < uploadImageDiv.length; i++) {
                let visibility = uploadImageDivClassList[i].style.visibility
                if (visibility === "") uploadImageDivClassList[i].style.visibility = "hidden"
                else uploadImageDivClassList[i].style.visibility = ""
            }
        })
        
        // Whenever added or deleted, reput the comments
        api.onCommentUpdate(function(comments, newComment) {
            // Put up the comments
            putComments(comments)
        })

        // Add a new comment
        document.getElementById("submitCommBtn").addEventListener("click", function(event) {
            event.preventDefault()
            let commentAuthor = document.getElementById("commentAuthorName").value
            let commentContent = document.getElementById("commentText").value
            if (commentAuthor !== "" && commentContent !== "" && images.length !== 0) {
                api.addComment(currImgID, commentAuthor, commentContent)
            }
        })

        // Comment prev button
        document.querySelector(".commentsPrevBtn").addEventListener("click", function(event) {
            event.preventDefault()
            currCommPage--
            if (currCommPage < 0) currCommPage = 0
            let currImg = images[currImgOffset]
            let currentComemnts = api.getComments(currImg.imageID, currCommPage)
            putComments(currentComemnts)
        })

        // Comment next button
        document.querySelector(".commentsNextBtn").addEventListener("click", function(event) {
            event.preventDefault()
            currCommPage++
            let currImg = images[currImgOffset]
            let currentComemnts = api.getComments(currImg.imageID, currCommPage)
            putComments(currentComemnts)
        })

        function putComments(comments) {
            // Ensure that the comments div is empty
            document.querySelector(".comments").innerHTML = ""
            console.log("comments: ", comments)
            // For every comment, put it on the screen
            comments.forEach(function(comment) {
                // Create a new div for every comment
                let div = document.createElement("div")
                div.className = "comments " + `commentId${comment.commentId}`
                div.innerHTML = `
                    <img src="media/user.png" />
                    <div>
                        Author: ${comment.author}                 
                    </div>
                    <div>
                        Text: ${comment.content}
                    </div>
                    <div>
                        Date: ${comment.date}
                    </div>
                    <div>
                        <button class="deleteButton deleteCommentId${comment.commentId}">DELETE</button>
                    </div>
                `
                // Add an event listener to the delete button in the comment div
                div.querySelector(".deleteButton").addEventListener("click", function(event) {
                    api.deleteComment(currImgID, comment._id)
                })
                // Add the div to the comments div
                document.querySelector(".comments").append(div)
            })
        }
    }
})()