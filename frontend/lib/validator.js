
define("validator", ["jquery"], function() {

    var Validator = function() {

        var self = this ;

        //Для ошибок
        self.errors = {} ;

        self.onError = true ;

        self.validateInfo = {} ;

        self.doValidateForm = function(form, showError) {

            var self = this ;

            self.errors = {} ;

            var isValidation = true ;

            form.find(":input").each(function(i, elem) {

                if($(this).attr("type") == "submit")
                    return ;

                var nameElement = $(this).attr("name") ;

                var valueElement =  $(this).val() ;


                if(self.validateInfo[nameElement] != undefined) {

                    var validators = self.validateInfo[nameElement] ;

                    if (validators.length > 0) {

                        for(var i = 0 ; i < validators.length; i++) {

                            var validator = validators[i] ;

                            var name = "" ; var arguments = {} ;

                            if(validator instanceof Array) {

                                if(validator[0] != undefined) {
                                    name =  validator[0] ;
                                }

                                if(validator[1] != undefined)  {
                                    arguments = validator[1] ;
                                }

                            }
                            else {

                                name = validator ;

                            }


                            if(self[name] != undefined) {

                                if(!self[name](valueElement, arguments, nameElement))
                                    isValidation = false ;
                            }



                        }

                        if(showError) {


                            if(self.errors[nameElement] != undefined) {

                                self.appendErrorsBlock(elem, nameElement) ;
                            }


                        }
                    }
                }
            }) ;


            return isValidation ;

        } ;



        self.appendErrorsBlock = function(elem, nameElement) {

            var blockError ;

            if(!($(elem).next().attr("class") == "error")) {
                blockError = $('<div class="error">') ;
                $(elem).after(blockError) ;
            }
            else
                blockError = $(elem).next() ;

            blockError.html("") ;

            for(var i = 0 ; i < self.errors[nameElement].length; i++) {

                blockError.append('<div class = "error-div">' +  self.errors[nameElement][i] + '</div>') ;

            }

        };

        return this ;

    };



    Validator.prototype.getErrors = function() {

        return this.errors ;

    };

    Validator.prototype.setValidateInfo = function(validateInfo) {

        this.validateInfo = validateInfo ;

        return this ;
    };

    Validator.prototype.setConfig = function(config) {

        if (config.error != undefined)  {

            if(config.error == 'on')
                this.onError = true ;
            else if (config.error == 'off')
                this.onError = false ;

        }

        if (config.validateInfo != undefined)
            this.setValidateInfo(config.validateInfo) ;

            return this ;
    };

    Validator.prototype.init = function (config) {

        this.setConfig(config) ;

        return this ;
    };


    Validator.prototype.addError = function(name, text) {

        if(this.onError) {

            if(this.errors[name] == undefined)
                this.errors[name] = [] ;

            this.errors[name].push(text) ;
        }


    };

    Validator.prototype.required = function(value, arguments , name) {

        if(value == "") {

            this.addError(name, " Поле  должно быть непустым ") ;

            return false ;

        }

        return true  ;

    };


    Validator.prototype.isInt = function(value, arguments , name) {


        if(!/^\d+$/.test(value)) {

            this.addError(name, " Поле  должно быть числом ") ;

            return false ;
        }

        var flag = true ;

        if(arguments.max != undefined) {

            if (value > arguments.max)
                flag = false ;

        }

        if(arguments.min != undefined) {

            if (value < arguments.min)
                flag = false ;

        }


        if(!flag)
            this.addError(name, " Поле не должно быть числом в диапозоне от " + arguments.min + "до" + arguments.max) ;

        return flag ;
    };


    Validator.prototype.inArray = function(value, arguments, name ) {


        if(arguments.range == undefined)
            return false ;

        for(var i = 0 ; i < arguments.range.length; i++) {

            if (arguments.range[i] == value)
                return true ;
        }


        this.addError(name, " Поле несоответсвует допустимым значениям ") ;

        return false ;
    };


    return Validator ;
}) ;
