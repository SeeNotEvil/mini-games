/**
 * Пример подлкючаемоего файла игры
 * Порядок запуска игры
 * game.prototype.init - Инициализация игры
 * game.prototype.setOptionsGame - установка опций игры в массив game.optionsGame
 * game.prototype.setOptionsPlayer - установка опций игры в массив game.optionsPlayer
 * game.prototype.loadedResources - Загрузка ресурсов
 * game.prototype.startGame - стартует игру
 */

define(["game", "jquery", "util", "io", "app"],
    function(game, $, util, Io, App) {

        var example = function () {

            var self = this ;

            example.super_.apply(this, arguments);


            self.init = function (optionsGame, optionsPlayer , cb) {
                console.log("Инициализация игры") ;
                example.super_.prototype.init.apply(this, arguments);
            };


            self.loadedResources = function (callback) {
                console.log("Загрузка ресуросов") ;
                require(["frontend/text!"+ self.directoryGame +"template.html",
                         "frontend/text!"+ self.directoryGame + "style.css"], function (template) {
                    self.template = template;

                    self.initGame(callback);
                })
            };

            self.initGame = function(callback) {
                console.log("Рисуем игру") ;
                self.initModules() ;
                $('#area').html(self.template) ;
                callback() ;
            };

            self.startGame = function(data) {

                console.log("Игра стартанула!!!!!!!") ;

            };
        };


        util.inherits(example, game) ;


        return example ;

    });