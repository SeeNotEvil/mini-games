/**
 * Пример подлкючаемоего файла игры
 * Порядок запуска игры
 * game.prototype.setGameOption - установка опций игры в массив game.prototype.options
 * game.prototype.init - инициализация игры
 * game.prototype.getOptionsGame - передача клиенту общих опций игры ,возвращает game.prototype.options
 * game.prototype.getOptionsPlayer - передача клиенту индивидуальных опций игрока, возвращает player.prototype.options
 * game.prototype.init - инициализирует игру
 * game.prototype.startGame - стартует игру
 */



var util = require('util');

var basicGames = require('../basic_games');


var balda = module.exports = function(constructOptions) {

    var self = this ;


    self.init = function() {

        balda.super_.prototype.init.apply(this, arguments);

    };

    self.startGame = function() {

        balda.super_.prototype.startGame.apply();

    };


    self.disconnectPlayer = function(id) {


        balda.super_.prototype.disconnectPlayer.apply(this, arguments);

        self.destroyGame() ;
    };

    balda.super_.apply(this, arguments);

}; util.inherits(quiz, basicGames.game);

