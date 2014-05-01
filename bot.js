var irc = require('irc'),
    _ = require('lodash'),
    fs = require("fs");

var ircConfig = {
    channels: ['##farce'],
    server: 'irc.freenode.net',
    botName: 'yahtzeebot',
    commandPrefix: '!'
};

var bot = new irc.Client(ircConfig.server, ircConfig.botName, {
    channels: ircConfig.channels
});

var commands = {};

fs.readdirSync("./commands").forEach(function(file) {
  var cmds = {};
  cmds[file.split('.').slice(0,-1).join('.')] = require("./commands/" + file)(bot);
  _.extend(commands, cmds);
});


/** Sets the bot up to listen for commands. **/
bot.addListener('message', function(from, to, text, message) {
    var parsed = text.match(new RegExp("^" + ircConfig.commandPrefix + "(\\S+)(?: +(.*))?"));
    if (!parsed) return;

    cmd = parsed[1];
    message.args = parsed[2] ? parsed[2].split(/[\s,]+/) : [];
    message.from = from;
    message.to = to;
    message.text = text;

    if (commands.hasOwnProperty(cmd)) commands[cmd](message);

});
