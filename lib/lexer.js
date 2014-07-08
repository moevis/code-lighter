(function($) {
	$.lexer = $.lexer || {};
	
	var Token = {};

	Token.type = {
		WHITE         : -1,
		NUMBER        : 0,
		BRACKET       : 1,
		OPERATION     : 2,
		STRING        : 3,
		LBRACE        : 4,
		RBRACE        : 5,
		SIMBOL        : 6,
		EOL           : 7,
		EOF           : 8,
		VAR           : 9,
		COMMENT       : 10,
		KEYS          : 11,
		BUILDINOBJECT : 12,
		FUNCTION      : 13,
		BUILDINMETHOD : 14,
		DOT           : 15,
		UNKNOWN       : 16
	};

	Token.map = (function(types) {
		var ret = {};
		for (var name in types) {
			ret[types[name]] = name;
		}
		return ret;
	}(Token.type));

	var State = {
		START             : 0,
		INNUM             : 1,
		INID              : 2,
		INCOMMENT         : 3,
		INASSIGN          : 4,
		INOBJECTS         : 5,
		INBLOCK           : 6,
		INOPERATION       : 7,
		INGEATER          : 8,
		INLESS            : 9,
		INPLUS            : 10,
		INMINUS           : 11,
		INTIMES           : 12,
		INDIV             : 13,
		INEQ              : 14,
		INSTRING          : 15,
		INMULTICOMMENT    : 16,
		INMULTICOMMENTEND : 17,
		INQUOTATION       : 18,
		INSINGLEQUOTATION : 19,
		INWHITE           : 20,
		DONE              : 21
	};

	var keyValues = {
		if         : 0,
		then       : 0,
		else       : 0,
		function   : 0,
		var        : 0,
		switch     : 0,
		case       : 0,
		return     : 0,
		do         : 0,
		while      : 0,
		new        : 0,
		try        : 0,
		in         : 0,
		null       : 0,
		typeof     : 0,
		instanceof : 0,
		prototype  : 0,
	};

	var buildInObject = {
		Date     : Token.type.BUILDINOBJECT,
		Regex    : Token.type.BUILDINOBJECT,
		document : Token.type.BUILDINOBJECT,
		windows  : Token.type.BUILDINOBJECT,
		console  : Token.type.BUILDINOBJECT,
		Math     : Token.type.BUILDINOBJECT,
		String   : Token.type.BUILDINOBJECT
	}

	var scan = function (stream, opt) {

		var tokens       = [],
			state        = 0,
			currentToken = null,
			buffer       = '',
			c            = '',
			tabSpace     = 4;

		if (opt !== undefined) {
			tabSpace = opt.tabSpace;
		}

		var intent = '';
		for (var i = 0; i < tabSpace; i++) {
			intent += ' ';
		}

		while (state !== State.DONE) {

			c = stream.read();
			var save = true;

			switch (state) {
				case State.START:
					if ($.type.isNum(c)) {
						state = State.INNUM;
					}else if ($.type.isAlpha(c) || c == '_') {
						state = State.INID;
					}else if ($.type.isWhite(c)) {
						state = State.INWHITE;
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
								state        = State.DONE;
								currentToken = Token.type.SIMBOL;
								break;
							case '.':
								state        = State.DONE;
								currentToken = Token.type.DOT;
								break;
							case '(':
								state        = State.DONE;
								currentToken = Token.type.LBRACE;
								break;
							case ')':
								state        = State.DONE;
								currentToken = Token.type.RBRACE;
								break;
							case '\'':
								state = State.INSINGLEQUOTATION;
								break;
							case '"':
								state = State.INQUOTATION;
								break;
							default:
								state        = State.DONE;
								currentToken = Token.type.UNKNOWN;
								break;
						}
					}
					break;

				case State.INSINGLEQUOTATION:
					if (c === '\'') {
						state = State.DONE;
						currentToken = Token.type.STRING;
					}
					break;

				case State.INQUOTATION:
					if (c === '"') {
						state = State.DONE;
						currentToken = Token.type.STRING;
					}
					break;

				case '"':
					state = State.INQUOTATION;
					break;

				case State.INNUM:
					if (!$.type.isNum(c) && c !== '.') {
						stream.putBack();
						save         = false;
						state        = State.DONE;
						currentToken = Token.type.NUMBER;
					}
					break;

				case State.INID:
					if (!$.type.isAlpha(c) && !$.type.isNum(c) && c!== '_') {
						stream.putBack();
						save         = false;
						state        = State.DONE;
						currentToken = Token.type.VAR;
					}
					break;

				case State.INWHITE:
					if (!$.type.isWhite(c)) {
						stream.putBack();
						save         = false;
						state        = State.DONE;
						currentToken = Token.type.WHITE;
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

					break;

				case State.INDIV:
					if (c === '=') {
						// divide
						state = State.DONE;
						currentToken = Token.type.OPERATION;
					} else if (c === '/'){
						state = State.INCOMMENT;
					} else if (c === '*') {
						state = State.INMULTICOMMENT;
					} else {
						// divide
						stream.putBack();
						state = State.DONE;
						currentToken = Token.type.OPERATION;
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
				if (c === '\t') {
					buffer += intent;
				} else {
					buffer += c;
				}
				
			}

			if (state === State.DONE) {
				if (currentToken === Token.type.VAR) {
					if (buffer in keyValues) {
						currentToken = Token.type.KEYS;
					} else if (buffer in buildInObject) {
						currentToken = Token.type.BUILDINOBJECT;
					} else if (tokens.length > 1) {
						var current = tokens.length;
						if (tokens[current - 1].type === Token.type.DOT && tokens[current - 2].type === Token.type.BUILDINOBJECT) {
							currentToken = Token.type.BUILDINMETHOD;
						}
					}
				} else if (currentToken === Token.type.LBRACE) {
					if (tokens.length > 0) {
						if (tokens[tokens.length - 1].type === Token.type.KEYS) {
							tokens[tokens.length - 1].type = Token.type.FUNCTION;
						}
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

	$.lexer['javascript'] = {
		scan: scan,
		map: Token.map
	};

}(lighter));

