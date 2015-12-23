var mongodb = require('mongodb').MongoClient;
var settings = require('../settings');

function Comment(name, day, title, comment) {
    this.name = name;
    this.day = day;
    this.title = title;
    this.comment = comment;
}

module.exports = Comment;

Comment.prototype.save = function (callback) {
    var name = this.name,
        day = this.day,
        title = this.title,
        comment = this.comment;
    mongodb.connect(settings.url, function(err, db) {
        if(err) {
            return callback(err);
        }
        var collection = db.collection('posts');
            collection.update({
                "name" : name,
                "time.day" : day,
                "title" :title
            }, {
                $push : {"comments" : comment}
            }, function(err) {
                db.close();
                if(err) {
                    return callback(err);
                }
                callback(null);
            });
        });
}
