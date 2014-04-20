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
    'roll' : function(player, to, text, message) {
        var die = player.lastRoll, i;

        message.args = _.map(message.args, parseFloat);

        if (player.rollTimes >= 3)
            return bot.say(to, player.name + ", you are out of rolls and must score.");

        if (player.rollTimes > 0 && _.isEmpty(message.args))
            return bot.say(to, player.name + ", last roll: " + player.lastRoll.join(",") + ". Please include the dice you want to keep in your command. Syntax: !roll 1 2 3");
    
        if (player.rollTimes > 0) {
            die = _.filter(die, function(val){
                var idx = message.args.indexOf(val);
                if (idx >= 0) message.args.splice(idx, 1);
                return idx >= 0;
            });
        }

        while (die.length < 5) die.push(_.random(1,6));

        player.lastRoll = die;
        player.rollTimes++;

        bot.say(to, player.name + " rolled " + die.join(",") + ". " + (3-player.rollTimes) + " rolls left for this turn.");
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
    'scoreboard' : function (player, to, text, message) {
        bot.say(to, 'Current scores: ' + _.map(Yahtzee.getPlayerList(), function(name){
            var player = Yahtzee.getPlayer(name);
            return name + ': ' + player.card.total();
        }).join(', '));
    },

    /**
     * Handles the "score" command.
     * Allows the user to score under the category of their choosing.
     */
    'score' : function (player, to, text, message) {
        var card = player.card;
        var dieScore = Yahtzee.getDieScoring(player.lastRoll);

        var unused = _.chain(card)
                        .map(function(val, key){
                            return val === null ? key : '';
                        })
                        .compact()
                        .value()
                        .join(', ');

        if (!card.hasOwnProperty(message.args[0]))
            return bot.say(to, player.name + ", please choose one of the following unused categories: " + unused);
        if (card[message.args[0]] !== null)
            return bot.say(to, player.name+", you've already used that category. Categories left: " + unused);
        
        card[message.args[0]] = +dieScore[message.args[0]];
        bot.say(to, player.name + ", you've just scored another " + (+dieScore[message.args[0]]) + " points. Roll again.");
        
        if (unused.length == 1) {
            bot.say(to, player.name +", that ends your game. Final score: " + player.total());
            player.done = true;
        } else {
            player.newTurn();
        }
    }
};

bot.addListener('message', function(from, to, text, message) {
    var parsed = text.match(new RegExp(ircConfig.commandPrefix + "^(\\S+)(?: +(.*))?"));
    if (!parsed) return; //ignore any message that doesn't fit the syntax !command .....

    var player = Yahtzee.getPlayer(from);

    cmd = parsed[1];
    message.args = parsed[2] ? parsed[2].split(/[\s,]+/) : [];

    if (!commands[cmd]) return;

    if (!player && cmd!="join")
        return bot.say(to, from + ", please say !join if you wish to play.");

    if (player && player.done)
        return bot.say(to, from + ", please type !join to reset your score and start over.");

    //The only reason we'd be here is if either player exists,
    //or the !join command has been invoked. !join takes from, while everything else
    //uses the player object.
    commands[cmd](player || from, to, text, message);

});
