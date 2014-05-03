_ = require("lodash");

var _db;
var dictionary = {};

require("mongodb").MongoClient.connect('mongodb://127.0.0.1:27017/nodeircbot', function(err, db){
    _db = db;

    db.collection("markov").drop();

    db.collection("chatlog").find(
        {
            nick: {$ne: "farce"},
            message: {$exists: true}
        },
        {
            message:1
        },
        function(err, result) {
            result.each(function(err, row){
                if (!row) {
                    return saveDictionary();
                }
                words = row.message.match(/[\w,']+/g) || [];
                for (var i = 1; i < words.length; i++){
                    if (!dictionary[words[i-1]]) dictionary[words[i-1]] = [];
                    dictionary[words[i-1]].push(words[i]);
                };             
            });
        }
    );
});


function saveDictionary(){
    dictionary = _.map(dictionary, function(words, key){
        var obj = {};
        obj._id = key;
        obj.words = _.mapValues(_.groupBy(words), function(words) { return words.length; });
        return obj;
    });
    _db.collection("markov").insert(dictionary, {w:1}, function(err, result) {
        if (!err) console.log("Saved");
        else console.log(err);
        process.exit();
    });
}
