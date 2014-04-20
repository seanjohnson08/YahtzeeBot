var irc = require('irc');
var _ = require('lodash');

var ircConfig = {
	channels: ['##farce'],
	server: 'irc.freenode.net',
	botName: 'yahtzeebot'
};

var bot = new irc.Client(ircConfig.server, ircConfig.botName, {
	channels: ircConfig.channels
});

function sum(a,b){return a+b;}


function Card(){
	this.aces = null;
	this.twos = null;
	this.threes = null;
	this.fours = null;
	this.fives = null;
	this.sixes = null;
	this.three_of_a_kind = null;
	this.four_of_a_kind = null;
	this.full_house = null;
	this.sm_straight = null;
	this.lg_straight = null;
	this.yahtzee = null;
	this.chance = null;
}
Card.prototype.getTotal = function () {
	return _.reduce(this, sum);
};

function Player(name){
	this.name = name;
	this.card = new Card();
	this.newTurn();
	this.done = false;
}
Player.prototype.newTurn = function () {
	this.lastRoll = [];
	this.rollTimes = 0;
};

var Yahtzee = {
	getDieScoring: function (die) {
		die.sort();

		var i,
			card = new Card(),
			numberNames = {
				1: 'aces',
				2: 'twos',
				3: 'threes',
				4: 'fours',
				5: 'fives',
				6: 'sixes'
			},
			sequential = 1;

		die.forEach(function(val, i){
			card[numberNames[val]] += val;

			card.chance += val;

			if (i && die[i-1] == val-1) sequential++;
			else if (i && die[i-1] != val) sequential = 1;

			if (sequential == 4) card.sm_straight = 30;
			if (sequential == 5) card.lg_straight = 40;
		});

		var group = _.chain(die)
					.groupBy()
					.values()
					.sortBy('length')
					.value();

		if (group.length == 2 && group[0].length == 2) card.full_house = 25;
		if (group.length == 1) card.yahtzee = 50;
		if (_.last(group).length >= 3) card.three_of_a_kind = _.reduce(_.last(group), sum);
		if (_.last(group).length >= 4) card.four_of_a_kind = _.reduce(_.last(group), sum);
		return card;
	},
	players: {}
};


var commands = {
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

		while(die.length < 5) die.push(_.random(1,6));

		player.lastRoll = die;
		player.rollTimes++;

		bot.say(to, player.name + " rolled " + die.join(",") + ". " + (3-player.rollTimes) + " rolls left for this turn.");
	},
	'join' : function (from, to, text, message) {
		player = new Player(from);
		Yahtzee.players[from] = player;
		bot.say(to, player.name+" has joined the game. Currently playing: " + _.keys(Yahtzee.players).join(", "));
	},
	'scoreboard' : function (player, to, text, message) {
		bot.say(to, 'Current scores: ' + _.map(Yahtzee.players, function(doc, name){
			return name + ': ' + doc.card.getTotal();
		}).join(', '));
	},
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
			bot.say(to, player.name +", that ends your game. Final score: " + player.getTotal());
			player.done = true;
		} else {
			player.newTurn();
		}
	},

	'debugScoring' : function (player, to, text, message) {
		message.args = message.args.map(parseFloat);
		console.log(Yahtzee.getDieScoring(message.args));
	}

};

bot.addListener('message',function(from, to, text, message) {
	var parsed = text.match(/^!(\S+)(?: +(.*))?/);

	var player = Yahtzee.players[from];

	if (!parsed) return;
	
	cmd = parsed[1];
	message.args = parsed[2] ? parsed[2].split(/[\s,]+/) : [];
	
	if (!commands[cmd]) return;

	if (!player && cmd!="join")
		return bot.say(to, from + ", please say !join if you wish to play.");

	if (player && player.done)
		return bot.say(to, from + ", please type !join to reset your score and start over.");

	commands[cmd](player || from, to, text, message);

});
