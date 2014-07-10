'use strict';

(function($) {
	$.lexer = $.lexer || {};
	
	var Token = {};

	Token.type = {
		WHITE         : -1,
		TAG           : 0,
		EOL           : 1,
		EOF           : 2,
		COMMENT       : 3,
		LANGLE        : 4,
		RANGLE        : 5,
		ATTRIBUTE     : 6,
		VALUE         : 7,
		CLOSETAG      : 8
	};

	Token.map = (function(types) {
		var ret = {};
		for (var name in types) {
			ret[types[name]] = name.toLowerCase();
		}
		return ret;
	}(Token.type));

	var State = {
		START: 0,
		INTAG: 1,
		INATTRIBUTE: 2,
		INVALUE: 3,
		INCOMMENT: 4,
		INDOCTYPE: 5,
		INWHITE: 6,
		DONE: 7
	};

	function States(startup) {
		this.states = [startup];
	};

	States.prototype.push = function(state) {
		this.states.push(state);
	};

	States.prototype.pop = function() {
		this.states.pop();
	};

	States.prototype.top = function() {
		return this.states[this.states.length - 1];
	};

	var scan = function (stream, opt) {
		var currentToken = null,
			tokens       = [],
			c            = '',
			buffer       = '',
			state        = new States(State.START);

		while (state.top() != State.DONE) {
			switch (state) {
				case State.START:
					if (c === '<') {
						state = State.INTAG;
					}
					break;
				case State.INTAG:

			}

			buffer += c;

			if (state.top() === State.DONE) {
				tokens.push({text: buffer, type: currentToken.type});
				buffer = '';

			}
		}
	};

	$.lexer['html'] = {
		scan: scan,
		map: Token.map
	};

}(lighter));