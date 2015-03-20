/**
 * Пример подлкючаемоего файла игры
 * Порядок запуска игры
 * game.prototype.init - Инициализация игры
 * game.prototype.setOptionsGame - установка опций игры в массив game.prototype.optionsGame
 * game.prototype.setOptionsPlayer - установка опций игры в массив game.prototype.optionsPlayer
 * game.prototype.loadedResources - Загрузка ресурсов
 * game.prototype.startGame - стартует игру
 */

define("games/balda/balda",["game", "jquery", "util", "io", "app", "mustache"],
    function(game, $, util, Io, App, Mustache) {

        var balda = function () {

            var self = this ;

            self.init = function (options, cb) {
                balda.super_.prototype.init.apply(this, arguments);
            };

            self.loadedResources = function (callback) {
                require([App.gameDirectory + "balda/template"], function (template) {
                    self.template = template;
                    self.initGame(callback);
                })
            };

            self.initGame = function(callback) {
                self.initModules() ;
                callback() ;
            };


        }





    });