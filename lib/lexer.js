(function($) {
	$.lexer = $.lexer || {};
	
	var token = {};

	token.type = {
		NUMBER: 0,
		BRACKET: 1,
		OPERATION: 2,
		STRING: 3,
		BRACE: 4,
		SIMBOL: 5,
		VAR: 6
	};

	var state = {
		VARS: 0,
		STATEMENTS: 1

	}
	var keyValues = {

	};

	var buffer = '';

	var addStyle = function (stream) {

		var tokens = [],
			states = [],
			c = '';

		do {

			c = stream.read();
			if (c == '/') {

			}

		} while(c != $.Stream.EOF);
	}

	$.lexer['javascript'] = function (editor, opt) {

	};
}(lighter));

