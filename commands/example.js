module.exports = function (bot) {
    return function (message) {
        bot.say(message.to, "Hello, " + message.from + ". " +
            "The arguments you passed to this command were: " + message.args.join(',') + ". " +
            "Here's your full message: " + message.text);
    };
};
