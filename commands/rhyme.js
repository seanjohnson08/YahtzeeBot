var request = require('request');
var _ = require('lodash');

module.exports = function (bot) {
    return function (message) {
        request({
            url: 'http://rhymebrain.com/talk',
            qs: {
                'function':'getRhymes',
                'word': message.args[0],
                'maxResults': 20
            },
            json: true
        }, function (error, response, body) {
            bot.say(message.to, "Words that rhyme with '" + message.args[0] + "': " +
                (_.chain(body)
                .filter(function(match){return match.score>250;})
                .pluck('word')
                .value()
                .join(', ')||'(none)'));
        });
    };
};
