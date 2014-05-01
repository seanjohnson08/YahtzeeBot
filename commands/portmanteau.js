var request = require('request');
var _ = require('lodash');

module.exports = function (bot) {
    return function (message) {
        request({
            url: 'http://rhymebrain.com/talk',
            qs: {
                'function':'getPortmanteaus',
                'word': message.args[0],
            },
            json: true
        }, function (error, response, body) {
            bot.say(message.to, "Portmanteaus for '" + message.args[0] + "': " +
                (_.chain(body)
                .pluck('combined')
                .value()
                .join(', ')||'(none)'));
        });
    };
};
