(function($) {
	$.lexer = $.lexer || {};
	
	var Token = {};

	Token.type = {
		NUMBER: 0,
		BRACKET: 1,
		OPERATION: 2,
		STRING: 3,
		BRACE: 4,
		SIMBOL: 5,
		EOL: 6,
		EOF: 7,
		VAR: 8,
		COMMENT: 9,
		KEYS: 10,
		UNKNOWN: 11
	};

	var State = {
		START: 0,
		INNUM: 1,
		INID: 2,
		INCOMMENT: 3,
		INASSIGN: 4,
		INOBJECTS: 5,
		INBLOCK: 6,
		INOPERATION: 7,
		INGEATER: 8,
		INLESS: 9,
		INPLUS: 10,
		INMINUS: 11,
		INTIMES: 12,
		INDIV: 13,
		INEQ: 14,
		INSTRING: 15,
		INMULTICOMMENT: 16,
		INMULTICOMMENTEND: 17,
		DONE: 18
	};

	var keyValues = {
		if: 0,
		then: 0,
		else: 0,
		function: 0,
		var: 0,
		switch: 0,
		case: 0,
		return: 0,
		do: 0,
		while: 0,
		Date: 0,
		Math: 0,
		Regex: 0
	};

	var scan = function (stream) {

		var tokens       = [],
			state        = 0,
			currentToken = null,
			buffer       = '',
			c            = '';

		while (state !== State.DONE) {

			c = stream.read();
			var save = true;

			switch (state) {
				case State.START:
					if ($.type.isNum(c)) {
						state = State.INNUM;
					}else if ($.type.isAlpha(c)) {
						state = State.INID;
					}else if ($.type.isWhite(c)) {
						save = false;
					}else if (c === '{' || c === '}') {
						currentToken = Token.type.BRACKET;
						state        = State.DONE;
					}else {
						switch(c) {
							case $.Stream.EOF:
								state = State.DONE;
								save = false;
								currentToken = Token.type.EOF;
								break;
							case $.Stream.EOL:
								state = State.DONE;
								save = false;
								currentToken = Token.type.EOL;
								break;
							case '=':
								state = State.INEQ;
								break;
							case '<':
								state = State.INLESS;
								break;
							case '>':
								state = State.INGEATER;
								break;
							case '+':
								state = State.INPLUS;
								break;
							case '-':
								state = State.INMINUS;
								break;
							case '*':
								state = State.INTIMES;
								break;
							case '/':
								state = State.INDIV;
								break;
							case '%':
								state = State.INMOD;
								break;
							case ',':
							case ':':
							case '[':
							case ']':
							case ';':
							case '.':
								state        = State.DONE;
								currentToken = Token.type.SIMBOL;
								break;
							case '(':
								state        = State.DONE;
								currentToken = Token.type.BRACE;
								break;
							case ')':
								state        = State.DONE;
								currentToken = Token.type.BRACE;
								break;
							default:
								state        = State.DONE;
								currentToken = Token.type.UNKNOWN;
								break;
						}
					}
					break;

				case State.INNUM:
					if (!$.type.isNum(c)) {
						stream.putBack();
						save         = false;
						state        = State.DONE;
						currentToken = Token.type.NUMBER;
					}
					break;

				case State.INID:
					if (!$.type.isAlpha(c)) {
						stream.putBack();
						save         = false;
						state        = State.DONE;
						currentToken = Token.type.VAR;
					}
					break;

				case State.INEQ:
					if (c === '=') {
						// equal
						state        = State.DONE;
						currentToken = Token.type.OPERATION;
					} else {
						// assign
						stream.putBack();
						state        = State.DONE;
						currentToken = Token.type.OPERATION;
					}
					save = false;
					break;

				case State.INLESS:
					if (c === '=') {
						// less and equal
						state        = State.DONE;
						currentToken = Token.type.OPERATION;
					} else {
						// less
						stream.putBack();
						state        = State.DONE;
						currentToken = Token.type.OPERATION;
					}
					save = false;
					break;

				case State.INGEATER:
					if (c === '=') {
						// greater and equal
						state        = State.DONE;
						currentToken = Token.type.OPERATION;
					} else {
						// greater
						stream.putBack();
						state        = State.DONE;
						currentToken = Token.type.OPERATION;
					}
					save = false;
					break;

				case State.INPLUS:
					if (c === '=') {
						// plugs itself
						state        = State.DONE;
						currentToken = Token.type.OPERATION;
					} else if (c === '+'){
						// plus plus
						state        = State.DONE;
						currentToken = Token.type.OPERATION;
					} else {
						// plus
						stream.putBack();
						state        = State.DONE;
						currentToken = Token.type.OPERATION;
					}
					save = false;
					break;

				case State.INMINUS:
					if (c === '=') {
						// minus itself
						state = State.DONE;
						currentToken = Token.type.OPERATION;
					} else if (c === '-'){
						// minus minus
						state        = State.DONE;
						currentToken = Token.type.OPERATION;
					} else {
						// minus
						stream.putBack();
						state = State.DONE;
						currentToken = Token.type.OPERATION;
					}
					save = false;
					break;

				case State.INTIMES:
					if (c === '=') {
						// times itsefl
						state = State.DONE;
						currentToken = Token.type.OPERATION;
					} else {
						// times
						stream.putBack();
						state = State.DONE;
						currentToken = Token.type.OPERATION;
					}
					save = false;
					break;

				case State.INDIV:
					if (c === '=') {
						// divide
						state = State.DONE;
						currentToken = Token.type.OPERATION;
						save = false;
					} else if (c === '/'){
						state = State.INCOMMENT;
					} else if (c === '*') {
						state = State.INMULTICOMMENT;
					} else {
						// divide
						stream.putBack();
						state = State.DONE;
						currentToken = Token.type.OPERATION;
						save = false;
					}
					break;

				case State.INCOMMENT:
					if (c === $.Stream.EOL) {
						stream.putBack();
						state = State.DONE;
						save = false;
						currentToken = Token.type.COMMENT;
					}
					break;

				case State.INMULTICOMMENT:
					if (c === '*') {
						if (stream.pick() === '/') {
							state = State.INMULTICOMMENTEND;
						}
					} else if (c === State.EOL) {
						if (stream.pick() === $.Stream.EOF) {
							state = State.DONE;
							save = false;
							stream.putBack();
						}
					}
					break;

				case State.INMULTICOMMENTEND:
					state        = State.DONE;
					currentToken = Token.type.COMMENT;
					break;

				default:
					//never reach
					break;
			}

			if (save === true) {
				buffer += c;
			}

			if (state == State.DONE) {
				if (currentToken === Token.type.VAR) {
					if (buffer in keyValues) {
						currentToken = Token.type.KEYS;
					}
				}
				tokens.push({text: buffer, type: currentToken});
				if (currentToken !== Token.type.EOF) {
					state = State.START;
					buffer = '';
				} else {
					state = State.DONE;
				}
			}
		}

		return tokens;
	};

	$.lexer['javascript'] = scan;

}(lighter));

