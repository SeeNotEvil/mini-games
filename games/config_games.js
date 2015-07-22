(function() {

	var configGames = {

        /**
         * Морской бой
         */
		water_war:
        {
			values: {
				timeMove: {
					value: 20,
					label: "Время хода"
				},

				timePreparation : {
					value: 40,
					label: "Время для расстановки кораблей"
				}
			},

			rules: {
				timeMove: ["required", ["isInt", {min: 20 , max: 60}]],
				timePreparation: ["required", ["isInt", {min: 20 , max: 60}]]
			},

			label: "Морской бой"
		},

        /**
         * Пример
         */
        example :
        {
            values: {
            },
            rules: {

            },
            label: "Пример"
        },

        /**
         * Крестики - нолики
         */
		tic_tac_toe:
        {
			values: {
				timeMove: {
					value: 20,
					label: "Время хода"
				},

				mode: {
					type: "array",
					value: {
                        default : "Стандартный 5x5",
						enlarged : "Расширенный 10x10"
					} ,
					label: "Режим игры"
				},

				step: {
					value: {
						"x" : "Крестики",
                        "o" : "Нолики"  ,
                        "" : "Случайный"
					} ,
					label: "Первый ход"
				}
			},

			rules: {
				timeMove: ["required", ["isInt", {min: 20 , max: 60}]]
			},

			label: "Крестики нолики"
		}
	};


    if (typeof define === 'function' && define.amd) {
        define(function() {
            return configGames ;
        })
    }
    else if (typeof exports !== 'undefined') {
        module.exports = configGames ;
    }

})() ;

 

