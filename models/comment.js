var mongodb = require('mongodb').MongoClient;
var settings = require('../settings');
var ObjectID = require('mongodb').ObjectID;
var async = require('async');

function Comment(_id, comment) {
    this._id = _id;
    this.comment = comment;
}

module.exports = Comment;

Comment.prototype.save = function (callback) {
    var _id = this._id,
        comment = this.comment;
    async.waterfall([
        function(cb) {
            mongodb.connect(settings.url, function(err, db) {
                cb(err, db);
            });
        },
        function(db, cb) {
            db.collection('posts').update({"_id" : ObjectID(_id)}, {
                $push : {"comments" : comment}
            }, function(err) {
                cb(err, db);
            });
        }
    ], function(err, db) {
        db.close();
        callback(err);
    });

    //mongodb.connect(settings.url, function(err, db) {
    //    if(err) {
    //        return callback(err);
    //    }
    //    var collection = db.collection('posts');
    //        collection.update({
    //            "_id" : ObjectID(_id)
    //        }, {
    //            $push : {"comments" : comment}
    //        }, function(err) {
    //            db.close();
    //            if(err) {
    //                return callback(err);
    //            }
    //            callback(null);
    //        });
    //    });
}
