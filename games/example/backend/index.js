/**
 * Пример подлкючаемоего файла игры
 * Порядок запуска игры
 * game.prototype.setGameOption - установка опций игры в массив game.prototype.options
 * game.prototype.init - инициализация игры
 * game.prototype.getOptionsGame - передача клиенту общих опций игры ,возвращает game.options
 * game.prototype.getOptionsPlayer - передача клиенту индивидуальных опций игрока, возвращает player.options
 * game.prototype.startGame - стартует игру, когда все игроки готовы на клиенте
 * заменить example на название своей игры
 */



var util = require('util');

var basicGames = require('../../../backend/basic_games');


var example = module.exports = function(constructOptions) {

    var self = this ;


    self.init = function() {
        console.log("Игра инициализирвована!!!") ;
        example.super_.prototype.init.apply(this, arguments);

    };

    self.startGame = function() {

        console.log("Игра стартанула!!!") ;
        example.super_.prototype.startGame.apply(this, arguments);

    };


    self.disconnectPlayer = function(id) {


        example.super_.prototype.disconnectPlayer.apply(this, arguments);

        self.destroyGame() ;
    };

    example.super_.apply(this, arguments);

}; util.inherits(example, basicGames.game);

