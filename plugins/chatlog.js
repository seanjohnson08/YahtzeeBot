module.exports = function(bot) {
    bot.addListener('message', function(from, to, text, message){
        console.log(from + ': ' + text);
        bot.db.collection('chatlog').save({
            nick: message.nick,
            to: to,
            message: text,
            timestamp: new Date()
        }, {w:1}, function(err, records) {
        });
    });
};
