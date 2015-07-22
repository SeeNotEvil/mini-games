
define("validator", ["jquery", "util", "common/lib/validator"], function($, util, baseValidator) {

    var Validator = function()
    {
        var self = this ;

        this.errors = {};
        this.onError = true;
        this.validateInfo = {};

        /**
         *
         * @param form - обьект формы jquery
         * @param showError {boolean} - выводит ошибки на форму
         * @returns {boolean}- прошла ли форма валидацию
         */
        self.doValidateForm = function(form, showError)
        {

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

        self.appendErrorsBlock = function(elem, nameElement)
        {
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

            return this ;
        };

    };

    util.inherits(Validator, baseValidator);

    return Validator ;

}) ;
