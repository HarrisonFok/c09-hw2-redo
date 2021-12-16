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

    function sendFiles(method, url, data, callback){
        let formdata = new FormData();
        Object.keys(data).forEach(function(key){
            let value = data[key];
            formdata.append(key, value);
        });
        let xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status !== 200) callback("[" + xhr.status + "]" + xhr.responseText, null);
            else callback(null, JSON.parse(xhr.responseText));
        };
        xhr.open(method, url, true);
        xhr.send(formdata);
    }
    
    function send(method, url, data, callback){
        let xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status !== 200) callback("[" + xhr.status + "]" + xhr.responseText, null);
            else callback(null, JSON.parse(xhr.responseText));
        };
        xhr.open(method, url, true);
        if (!data) xhr.send();
        else{
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(data));
        }
    }
    
    // add an image to the gallery
    module.addImage = function(title, author, url, callback){
        sendFiles("POST", "/api/images", { title, author, url }, callback)
    }

    module.getAllImages = function(callback) {
        // return data.images
        send("GET", "/api/images", null, callback)
    }

    module.getImage = function(imageId, callback) {
        send("GET", "/api/images/" + imageId + "/", null, callback)
    }
    
    // delete an image from the gallery given its imageId
    module.deleteImage = function(imageId, callback){
        send("DELETE", "/api/images/" + imageId + "/", null, callback)
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