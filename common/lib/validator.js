/**
 * Класс валидации
 * Правило валидации должно удовлетворять сигнатуре  : название - function (value, arguments, name)
 * , где value
 */

(function() {

    var Validator = function () {
        this.errors = {};
        this.onError = true;
        this.validateInfo = {};
        return this;
    };

    /**
     * Получить массив ошибок
     */
    Validator.prototype.getErrors = function () {
        return this.errors;
    };

    /**
     *
     * @param array - массив значений
     * @param {boolean} del - удаляет те свойства которых нет в правилах для валидации
     * @returns {boolean}
     */
    Validator.prototype.doValidateArray = function (array, del)
    {
        var isValidation = true;

        for (var key in array) {
            if (this.validateInfo[key] != undefined) {
                var validators = this.validateInfo[key];

                if (validators.length > 0) {
                    for (var i = 0; i < validators.length; i++) {
                        var validator = validators[i];
                        var name = "";
                        var arguments = {};

                        if (validator instanceof Array) {
                            if (validator[0] != undefined) {
                                name = validator[0];
                            }
                            if (validator[1] != undefined) {
                                arguments = validator[1];
                            }
                        }
                        else {
                            name = validator;
                        }

                        if (this[name] != undefined) {
                            if (!this[name](array[key], arguments))
                                isValidation = false;
                        }
                    }
                }
            }
            else {
                if (del) {
                    delete(array[key]);
                }
            }
        }

        return isValidation;
    };

    /**
     * Установить конфиг
     * config.error {boolean} - включает , выключает сбор ошибок
     * config.validateInfo - массив правил валидации
     */
    Validator.prototype.setConfig = function (config)
    {
        if (config.error != undefined) {
            if (config.error == 'on')
                this.onError = true;
            else if (config.error == 'off')
                this.onError = false;
        }

        if (config.validateInfo != undefined)
            this.setValidateInfo(this.validateInfo);

        return this;
    };


    Validator.prototype.setValidateInfo= function(validateInfo)
    {
        this.validateInfo = validateInfo;
        return this ;
    };

    Validator.prototype.init = function (config)
    {
        if (config != undefined)
            this.setConfig(config);

        return this;
    };

    /**
     * Добавление ошибки
     */
    Validator.prototype.addError = function (name, text)
    {
        if (this.onError) {
            if (this.errors[name] == undefined)
                this.errors[name] = [];
            this.errors[name].push(text);
        }

    };

    /**
     *
     * @param value
     * @param arguments
     * @param name
     * @returns {boolean}
     */
    Validator.prototype.required = function (value, arguments, name)
    {
        if (value == "") {
            this.addError(name, " Поле  должно быть непустым ");
            return false;
        }

        return true;
    };

    /**
     * Является ли значение числом в диапозоне от min до max
     * @param value - Значение числа
     * @param arguments - Диапозон числа
     * @param name - Имя поля
     */
    Validator.prototype.isInt = function (value, arguments, name)
    {

        if (!/^\d+$/.test(value)) {
            this.addError(name, " Поле  должно быть числом ");
            return false;
        }

        var flag = true;

        if (arguments.max != undefined) {
            if (value > arguments.max)
                flag = false;
        }

        if (arguments.min != undefined) {
            if (value < arguments.min)
                flag = false;
        }

        if (!flag)
            this.addError(name, " Поле должно быть числом в диапозоне от " + arguments.min + "до" + arguments.max);

        return flag;
    };

    /**
     * Является ли значение допустимым из массива
     * @param value - Значение числа
     * @param arguments - Диапозон числа
     * @param name - Имя поля
     */
    Validator.prototype.inArray = function (value, arguments, name)
    {
        if (arguments.range == undefined)
            return false;

        for (var i = 0; i < arguments.range.length; i++) {

            if (arguments.range[i] == value)
                return true;
        }

        this.addError(name, " Поле несоответсвует допустимым значениям ");

        return false;
    };



    if (typeof define === 'function' && define.amd) {
        define(function() {
            return Validator ;
        })
    }
    else if (typeof exports !== 'undefined') {
        module.exports = Validator ;
    }

})() ;
