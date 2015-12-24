var mongodb = require('mongodb').MongoClient;
var settings = require('../settings');
var ObjectID = require('mongodb').ObjectID;

function Comment(_id, comment) {
    this._id = _id;
    this.comment = comment;
}

module.exports = Comment;

Comment.prototype.save = function (callback) {
    var _id = this._id,
        comment = this.comment;
    mongodb.connect(settings.url, function(err, db) {
        if(err) {
            return callback(err);
        }
        var collection = db.collection('posts');
            collection.update({
                "_id" : ObjectID(_id)
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
