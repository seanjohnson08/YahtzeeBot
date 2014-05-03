_ = require('lodash');

function getNextWord(bot, word, chain, msg){
    bot.db.collection("markov").findOne({_id: word}, function(err, result){
        if (!result || chain.length > 100) {
            return bot.say(msg.to, chain);
        }
        var words = result.words;
        var rand = Math.floor(Math.random() * _.reduce(words, function(a,b) {return a+b;}));
        _.forEach(words, function(value, key) {
            if (rand < value) {
                chain += key + " ";
                word = key;
                return false;
            }
            rand -= value;
        });
        getNextWord(bot, word, chain, msg);
    });
}

module.exports = function(bot) {
    return function(message){
        getNextWord(bot, message.args[0], message.args[0] + " ", message);
    };
};

