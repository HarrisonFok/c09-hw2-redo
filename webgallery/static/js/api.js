let api = (function(){
    let module = {};
    let data
    
    /*  ******* Data types *******
        image objects must have at least the following attributes:
            - (String) imageId 
            - (String) title
            - (String) author
            - (String) url
            - (Date) date
    
        comment objects must have the following attributes
            - (String) commentId
            - (String) imageId
            - (String) author
            - (String) content
            - (Date) date
    
    ****************************** */ 

    module.initImages = () => {
        if (!localStorage.getItem("data")) {
            data = {
                imagesCount: 0,
                images: [],
                commentsCount: 0,
                comments: []
            }
            localStorage.setItem("data", JSON.stringify(data))
        } else {
            data = JSON.parse(localStorage.getItem("data"))
        }
        return data
    }
    
    // add an image to the gallery
    module.addImage = function(title, author, url){
        console.log(title, author, url)
        let date = new Date()
        data.imagesCount++
        let newImage = {
            imageID: data.imagesCount,
            title,
            author,
            url,
            date: date.toDateString() + " " + date.toTimeString().split(" ")[0]
        }
        // Add the new image to the local storage data
        data.images.push(newImage)
        // Update local storage
        localStorage.setItem("data", JSON.stringify(data))
        notifyImageListeners()
        return newImage
    }

    module.getAllImages = function() {
        return data.images
    }
    
    // delete an image from the gallery given its imageId
    module.deleteImage = function(imageId){
        console.log(imageId, typeof(imageId))
        if (data.imagesCount >= 0) data.imagesCount--
        data.images = data.images.filter(img => img.imageID !== imageId)
        localStorage.setItem("data", JSON.stringify(data))
        notifyImageListeners()
    }
    
    // add a comment to an image
    module.addComment = function(imageId, author, content){
        console.log(imageId, author, content)
        let date = new Date()
        data.commentsCount++
        let newComment = {
            commentId: data.commentId,
            imageID: imageId,
            author,
            content,
            date: date.toDateString() + " " + date.toTimeString().split(" ")[0]
        }
        // Add the new comment to the local storage data
        data.comments.push(newComment)
        // Update local storage
        localStorage.setItem("data", JSON.stringify(data))
        notifyCommentListeners(newComment)
        return newComment
    }

    // get 10 comments per page
    module.getComments = function(currImgID, page=0) {
        let commentsPerPage = 10
        let commentsForImg = data.comments.filter(comment => comment.imageId === currImgID).reverse()
        let numPages = Math.ceil(commentsForImg.length / commentsPerPage)
        let paginatedComments = []
        if (page <= numPages) {
            // Calculate starting comment index
            let startIndexPage = page * commentsPerPage
            // Add 10 to that
            let endIndexPage = startIndexPage + 10
            // Get those
            paginatedComments = commentsForImg.slice(startIndexPage, endIndexPage)
        }
        return paginatedComments
    }
    
    // delete a comment to an image
    module.deleteComment = function(commentId){
        let deletedComment = null
        deletedComment = data.comments.filter(comment => comment.commentId === commentId)
        data.comments = data.comments.filter(comment => comment.commentId !== commentId)
        localStorage.setItem("data", JSON.stringify(data))
        notifyCommentListeners(deletedComment)
    }

    let imageHandlers = [];

    // notify all image listeners
    function notifyImageListeners() {
      imageHandlers.forEach(function(handler) {
        handler(data.images);
      });
    }

    // call handler when an image is added or deleted from the gallery
    module.onImageUpdate = function(handler){
        imageHandlers.push(handler)
    }
  
    let commentHandlers = [];
  
    // notify all comment listeners
    function notifyCommentListeners(comment) {
      commentHandlers.forEach(function(handler) {
        handler(module.getComments(comment.imageId, 0));
      });
    }
  
    // call handler when a comment is added or deleted to an image
    module.onCommentUpdate = function(handler) {
      commentHandlers.push(handler);
    };
    
    return module;
})();