var _ = require('lodash');

//private variables
var players = {};

Yahtzee = {
    /**
     * Returns a card representing all possible scoring values for a given set of die.
     * @param {array} die - The array of die values
     */
    getDieScoring: function (die) {

        var i,
            card = new this.Card(),
            numberNames = {
                1: 'aces',
                2: 'twos',
                3: 'threes',
                4: 'fours',
                5: 'fives',
                6: 'sixes'
            },
            sequential = 1,
            maxSequential = 1;

        die.sort();
        
        die.forEach(function(val, i){
            card[numberNames[val]] += val;
            card.chance += val;

            if (i && die[i-1] == val-1) sequential++;
            else if (i && die[i-1] != val) sequential = 1;
            maxSequential = Math.max(sequential, maxSequential);
        });
        var group = _.chain(die)
                    .groupBy()
                    .values()
                    .sortBy('length')
                    .value();

        card.sm_straight     = sequential == 4 ? 30 : 0;
        card.lg_straight     = sequential == 5 ? 40 : 0;
        card.full_house      = group[0].length == 2 && group[1].length == 3 ? 25 : 0;
        card.yahtzee         = group.length ==1 ? 50 : 0;
        card.three_of_a_kind = _.last(group).length >= 3 ? card.chance : 0;
        card.four_of_a_kind  = _.last(group).length >= 4 ? card.chance : 0;
        return card;
    },

    addPlayer: function (name){
       players[name] = new this.Player(name);
    },

    getPlayer: function (name) {
        return players[name];
    },

    getPlayerList: function () {
        return _.keys(players);
    },

    ensurePlaying: function (name) {
        var player = this.getPlayer(name);

        if (!player)
            return name + ", please say !join if you wish to play.";

        if (player && player.done)
            return name + ", please type !join to reset your score and start over.";
    }
};

/**
 * The Player class. Keeps track of all information regarding a player.
 * @param {string} name - The name of the player (Nick).
 */
Yahtzee.Player = function (name){
    this.name = name;
    this.card = new Yahtzee.Card();
    this.newTurn();
    this.done = false;
};
_.assign(Yahtzee.Player.prototype, {
    /**
     * Sets the player up to begin a new turn.
     */
    newTurn: function () {
        this.lastRoll = [];
        this.rollTimes = 0;
    },

    /**
     * Rolls the die.
     * @param {dieToKeep} an array of die that should be held from the last turn.
     */
    roll: function (dieToKeep) {
        var die = this.lastRoll, i;

        dieToKeep = _.map(dieToKeep, parseFloat);

        if (this.rollTimes >= 3)
            return this.name + ", you are out of rolls and must score.";

        if (this.rollTimes > 0 && _.isEmpty(dieToKeep))
            return this.name + ", last roll: (" + this.lastRoll.join(", ") + "). Please include the dice you want to keep in your command. Syntax: !roll 1 2 3";
    
        if (this.rollTimes > 0) {
            die = _.filter(die, function(val){
                var idx = dieToKeep.indexOf(val);
                if (idx >= 0) dieToKeep.splice(idx, 1);
                return idx >= 0;
            });
        }

        while (die.length < 5) die.push(_.random(1,6));

        this.lastRoll = die;
        this.rollTimes++;

        return this.name + " rolled (" + die.join(", ") + "). " + (3-this.rollTimes) + " rolls left for this turn.";
    },

    /**
     * Allows the player to score under the given category based on the last dice roll.
     * @param {string} category - The category to score under.
     */
    score: function (category) {
        var card = this.card, dieScore, unused;

        if (_.isEmpty(this.lastRoll))
            return this.name + ", you haven't rolled yet. Please use !roll before trying to score.";
        
        dieScore = Yahtzee.getDieScoring(this.lastRoll);


        unused = _.chain(card)
                    .map(function(val, key){
                        return val === null ? key : '';
                    })
                    .compact()
                    .value()
                    .join(', ');

        if (category == "yahtzee" && card.yahtzee !== null && dieScore[category] !== null) {
            card.yahtzee+=100;
            this.newTurn();
            return "Amazing! " + this.name + " just scored a bonus yahtzee. +100 points.";
        }

        if (!card.hasOwnProperty(category))
            return this.name + ", please choose one of the following unused categories: " + unused;

        if (card[category] !== null)
            return this.name+", you've already used that category. Categories left: " + unused;
        
        card[category] = +dieScore[category];

        if (unused.length == 1) {
            this.done = true;
            return this.name +", that ends your game. Final score: " + this.card.total();
        } else {
            this.newTurn();
            return this.name + ", you've just scored another " + (+dieScore[category]) + " points. Roll again.";
        }
    }
});


/**
 * The Card class. Represents a Yahtzee scoring card.
 */
Yahtzee.Card = function(){
    _.assign(this, {
        aces: null,
        twos: null,
        threes: null,
        fours: null,
        fives: null,
        sixes: null,
        three_of_a_kind: null,
        four_of_a_kind: null,
        full_house: null,
        sm_straight: null,
        lg_straight: null,
        yahtzee: null,
        chance: null
    });
};
Yahtzee.Card.prototype.total = function () {
    return _.reduce(this, function(a,b){return a+b;});
};



module.exports = Yahtzee;
