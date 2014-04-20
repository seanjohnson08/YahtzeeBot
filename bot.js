var irc = require('irc');
var _ = require('lodash');
var Yahtzee = require('./core/yahtzee.js');

var ircConfig = {
    channels: ['##farce'],
    server: 'irc.freenode.net',
    botName: 'yahtzeebot',
    commandPrefix: '!'
};

var bot = new irc.Client(ircConfig.server, ircConfig.botName, {
    channels: ircConfig.channels
});


var commands = {
    /**
     * Handles the "roll" command.
     * Has two behaviors:
     * 1. If the user hasn't rolled yet, roll 5 die.
     * 2. If the user has rolled, then use the list of numbers passed in to "keep"
     *    from the last roll and roll again.
     */
    'roll' : function(from, to, text, message) {
        bot.say(to, Yahtzee.ensurePlaying(from) ||
                    Yahtzee.getPlayer(from).roll(message.args));
    },

    /**
     * Handles the "join" command.
     * Adds the player to the current game.
     */
    'join' : function (from, to, text, message) {
        Yahtzee.addPlayer(from);
        bot.say(to, from + " has joined the game. Currently playing: " + Yahtzee.getPlayerList().join(', '));
    },

    /**
     * Handles the "scoreboard" command.
     * Displays the list of users and their scores.
     */
    'scoreboard' : function (from, to, text, message) {
        bot.say(to, 'Current scores: ' + _.map(Yahtzee.getPlayerList(), function(name){
            var player = Yahtzee.getPlayer(name);
            return name + ': ' + player.card.total();
        }).join(', '));
    },

    /**
     * Handles the "score" command.
     * Allows the user to score under the category of their choosing.
     */
    'score' : function (from, to, text, message) {
        bot.say(to, Yahtzee.ensurePlaying(from) ||
                    Yahtzee.getPlayer(from).score(message.args[0]));
    }
};

bot.addListener('message', function(from, to, text, message) {
    var parsed = text.match(new RegExp("^" + ircConfig.commandPrefix + "(\\S+)(?: +(.*))?"));
    if (!parsed) return; //ignore any message that doesn't fit the syntax !command .....

    cmd = parsed[1];
    message.args = parsed[2] ? parsed[2].split(/[\s,]+/) : [];

    if (!commands[cmd]) return;

    //The only reason we'd be here is if either player exists,
    //or the !join command has been invoked. !join takes from, while everything else
    //uses the player object.
    commands[cmd](from, to, text, message);

});
