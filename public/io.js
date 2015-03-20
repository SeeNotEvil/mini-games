define(function(){	
	
	var Io =
	{
		socket : null ,
		
		init : function() 
		{
			Io.socket = io.connect('http://localhost:3000');
		},

	}
	
	return Io ;
	
	
})	
		