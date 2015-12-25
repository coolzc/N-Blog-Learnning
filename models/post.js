var mongodb = require('mongodb').MongoClient;
var markdown = require('markdown').markdown;
var settings = require('../settings');
var ObjectID = require('mongodb').ObjectID;

function Post(name, head, title, tags, post) {
    this.name = name;
    this.head = head;
    this.title = title;
    this.tags = tags;
    this.post = post;
}

module.exports = Post;

Post.prototype.save = function(callback) {
    var date= new Date();
    var time = {
        date : date,
        year : date.getFullYear(),
        month : date.getFullYear() + "-" + (date.getMonth() + 1),
        day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes())
    }

    var post = {
        name : this.name,
        head : this.head,
        time : time,
        title : this.title,
        tags : this.tags,
        post : this.post,
        comments : [],
        reprint_info : {},
        pv : 0
    };

    mongodb.connect(settings.url, function(err, db) {
        if(err) {
            return callback(err);
        }
        var collection = db.collection('posts');
        collection.insertOne(post,{safe : true}, function(err) {
                db.close();
                if(err) {
                    return callback(err);
                }
                callback(null);
            });
        });
}

Post.getTen = function(name, page, callback) {
    mongodb.connect(settings.url, function(err, db) {
        if(err) {
           return callback(err);
        }
        var collection = db.collection('posts');
            var query = {};
            if(name) {
                query.name = name;
            }
            collection.count(query, function(err, total) {
                collection.find(query, {
                    skip : (page - 1) * 10,
                    limit : 10
                }).sort({time : -1}).toArray(function(err, docs) {
                    db.close();
                    if(err) {
                        return callback(err);
                    }
                    docs.forEach(function(doc) {
                        doc.post = markdown.toHTML(doc.post);
                    });
                    callback(null, docs, total);
                });
            });
        });
}

Post.getOne = function(_id, callback) {
    mongodb.connect(settings.url, function(err, db) {
        if(err) {
            return callback(err);
        }
        var collection = db.collection('posts');
            collection.findOne({
                "_id" : new ObjectID(_id)
            }, function(err, doc) {
                if(err) {
                    db.close();
                    return callback(err);
                }
                if (doc) {
                    collection.update({
                        "_id" : new ObjectID(_id)
                    }, {
                        $inc : {"pv" : 1}
                    }, function(err) {
                        db.close();
                        if(err) {
                            return callback(err);
                       }
                    });
                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function (comment) {
                        comment.content = markdown.toHTML(comment.content);
                  });
                callback(null, doc);
                }
            });
        });
};

Post.edit = function(_id, callback) {
    mongodb.connect(settings.url, function(err, db) {
        if(err) {
            return callback(err);
        }
        var collection = db.collection('posts');
            collection.findOne({
                "_id" : new ObjectID(_id)
            }, function(err, doc) {
                db.close();
                if(err) {
                    return callback(err);
                }
                callback(null, doc);
            });
        });
    };

Post.update = function(_id, post, callback) {
    mongodb.connect(settings.url, function(err, db) {
        if(err) {
            return callback(err);
        }
        var collection = db.collection('posts');
            collection.update({
                "_id" : ObjectID(_id)
            }, {
                $set : {post : post}
            }, function(err) {
                db.close();
                if(err) {
                    return callback(err);
                }
                callback(null);
            });
        });
}

Post.remove = function(_id, callback) {
    mongodb.connect(settings.url, function(err, db) {
        if(err) {
            return callback();
        }
        var collection = db.collection('posts');
            collection.find({
                "_id" : ObjectID(_id)
            }, function(err, doc) {
                if(err) {
                    db.close();
                    return callback(err);
                }
                var reprint_from = "";
                if(doc.reprint_info.reprint_from) {
                    reprint_from = doc.reprint_info.reprint_from;
                }
                if(reprint_from != "") {
                    collection.update({
                        "_id" : ObjectID(_id)
                    }, {
                        $pull : {
                            "reprint_info.reprint_to" : {
                                "name" : name,
                                "day" : day,
                                "title" : title
                            }}
                    }, function(err) {
                        if(err) {
                            db.close();
                            return callback(err);
                        }
                    });
                }

                collection.remove({
                    "_id" : ObjectID(_id)
                }, {
                    w : 1
                }, function(err) {
                    db.close();
                    if(err) {
                        return callback(err);
                    }
                    callback(null);
                });
            });
        });
}

Post.getArchive = function(callback) {
    mongodb.connect(settings.url, function(err, db) {
        if(err) {
            return callback(err);
        }
        var collection = db.collection('posts');
            collection.find({}, {
                "name" : 1,
                "time" : 1,
                "title" : 1
            }).sort({time : -1}).toArray(function(err, docs) {
                db.close();
                if(err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
}

Post.getTag = function(tag, callback) {
    mongodb.connect(settings.url, function(err, db) {
        if(err) {
            return callback(err);
        }
        var collection = db.collection('tags');
            collection.find({
                "tags" : tag
            }, {
                "name" : 1, "time" : 1, "title" : 1
            }).sort({
                time : -1
            }).toArray(function(err, docs) {
                db.close();
                if(err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
}

Post.getTags = function(callback) {
    mongodb.connect(settings.url, function(err, db) {
       if(err) {
           return callback(err);
       }
       var collection = db.collection('posts');
       collection.distinct('tags', function(err, docs) {
           db.close();
           if(err) {
               return callback(err);
           }
           callback(null, docs);
       });
   });
}

Post.search = function(keyword, callback) {
    mongodb.connect(settings.url, function(err, db) {
        if(err) {
            return callback(err);
        }
        var collection = db.collection('posts');
        var pattern = new RegExp(keyword, "i");
        collection.find({
            "title" : pattern
        }, {
            "name" : 1,
            "time" : 1,
            "title" : 1
        }).sort({
            time : -1
        }).toArray(function(err, docs) {
            db.close();
            if(err) {
                return callback(err);
            }
            callback(null, docs);
        });
    });
}


Post.reprint = function(_id, reprint_to, callback) {
    mongodb.connect(settings.url, function(err, db) {
        if(err) {
            return callback(err);
        }
        var collection = db.collection('posts');
            collection.findOne({
                "_id" : ObjectID(_id)
            }, function(err, doc) {
                if(err) {
                    db.close();
                    return callback(err);
                }

                var date = new Date();
                var time = {
                    date : date,
                    year : date.getFullYear(),
                    month : date.getFullYear() + "-" + (date.getMonth() + 1),
                    day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
                    minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes())
                }

                delete doc._id;
                doc.reprint_info = {"reprint_from" : {
                    name : doc.name,
                    day : doc.time.day,
                    title : doc.title
                }};
                doc.name = reprint_to.name;
                doc.head = reprint_to.head;
                doc.time = time;
                doc.title = (doc.title.search(/[转载]/) > -1) ? doc.title : "[转载]" + doc.title;
                doc.comments = [];
                doc.pv = 0;

                collection.update({
                    "_id" : ObjectID(_id)
                }, {
                    $push : {
                       "reprint_info.reprint_to" : {
                       "name" : doc.name,
                       "day" : time.day,
                       "title" : doc.title
                    }}
                }, function(err) {
                    if(err) {
                        db.close();
                        return callback(err);
                    }
                });

                collection.insert(doc, {
                    safe : true
                }, function(err, post) {
                    db.close();
                    if(err) {
                        return callback(err);
                    }
                    callback(err, post.ops[0]);
                });
            });
        });
}
