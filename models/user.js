var mongodb = require('mongodb').MongoClient;
var crypto = require('crypto');
var settings = require('../settings');
var async = require('async');

function User(user) {
  this.name = user.name;
  this.password = user.password;
  this.email = user.email;
};

module.exports = User;

User.prototype.save = function(callback) {
  var md5 = crypto.createHash('md5'),
      email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
      head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
  var user = {
      name: this.name,
      password: this.password,
      email: this.email,
      head : head
  };

  async.waterfall([
      function(cb) {
        mongodb.connect(settings.url, function(err, db) {
            cb(err, db);
        });
      },
      function(db, cb) {
          db.collection('users').insert(user, {safe : true}, function(err,user) {
              cb(err, db, user);
          });
      }
  ], function(err, db, user) {
        db.close();
        callback(err, user[0]);
  });

  //mongodb.connect(settings.url, function (err, db) {
  //  if (err) {
  //    return callback(err);//错误，返回 err 信息
  //  }
  //  var collection = db.collection('users');
  //    collection.insert(user,function (err, user) {
  //      db.close();
  //      if (err) {
  //       )return callback(err);//错误，返回 err 信息
  //      }
  //      callback(null, user[0]);//成功！err 为 null，并返回存储后的用户文档
  //    });
  //  });
};

User.get = function(name, callback) {
    async.waterfall([
        function(cb) {
            mongodb.connect(settings.url, function(err,db) {
                cb(err, db);
            });
        },
        function(db, cb) {
            db.collection('users').findOne({name : name}, function(err, user) {
                cb(err, db, user);
            });
        }
    ], function(err, db, user) {
        db.close();
        callback(err, user)
    });
  //mongodb.connect(settings.url, function (err, db) {
  //  if (err) {
  //    return callback(err);//错误，返回 err 信息
  //  }
  //  var collection = db.collection('users');
  //    collection.findOne({
  //      name: name
  //    }, function (err, user) {
  //      db.close();
  //      if (err) {
  //        return callback(err);//失败！返回 err 信息
  //      }
  //      callback(null, user);//成功！返回查询的用户信息
  //    });
  //});
};
