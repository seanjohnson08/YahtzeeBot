var _ = require('lodash'),
    Yahtzee = require('../core/Yahtzee.js');

module.exports = function(bot) {
    return function (from, to, text, message){
        var subCommands = {
            /**
             * Rolls the dice.
             * Has two behaviors:
             * 1. If the user hasn't rolled yet, roll 5 die.
             * 2. If the user has rolled, then use the list of numbers passed in to "keep"
             *    from the last roll and roll again.
             */
            roll : function(from, to, text, message) {
                bot.say(to, Yahtzee.ensurePlaying(from) ||
                            Yahtzee.getPlayer(from).roll(message.args));
            },

            /**
             * Adds the player to the current game.
             */
            join : function (from, to, text, message) {
                Yahtzee.addPlayer(from);
                bot.say(to, from + " has joined the game. Currently playing: " + Yahtzee.getPlayerList().join(', '));
            },

            /**
             * Displays the list of users and their scores.
             */
            scoreboard : function (from, to, text, message) {
                bot.say(to, 'Current scores: ' + _.map(Yahtzee.getPlayerList(), function(name){
                    var player = Yahtzee.getPlayer(name);
                    return name + ': ' + player.card.total();
                }).join(', '));
            },

            /**
             * Handles the "score" command.
             * Allows the user to score under the category of their choosing.
             */
            score : function (from, to, text, message) {
                bot.say(to, Yahtzee.ensurePlaying(from) ||
                            Yahtzee.getPlayer(from).score(message.args[0]));
            }
        };

        if (message.args[0] && subCommands[message.args[0]]) subCommands[message.args[0]](from, to, text, message);
        else bot.say(to, "Invalid command. Valid options: " + _.keys(subCommands).join(", "));
    };
};