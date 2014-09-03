'use strict';

var lighter = (function () {

	var $ = {};

	function Event(e) {
		this.e = e;
	}

	Event.prototype.preventDefault = function () {
		if (this.e.preventDefault) {
			this.e.preventDefault();
		}
		this.e.returnValue = false;
	};

	Event.prototype.stopPropagation = function () {
		if (this.e.stopPropagation) {
			this.e.stopPropagation();
		}
		this.e.cancelBubble = true;
	};

	Event.prototype.target = function () {
		return this.e.target || this.e.srcElement || document;
	};

	Event.prototype.postion = function() {
		var pos = [0, 0];
		if (this.e.pageX || this.e.pageY) {
			pos[0] = this.e.pageX;
			pos[1] = this.e.pageY;
		} else if (this.e.clientX || this.e.clientY) {
			pos[0] = this.e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			pos[1] = this.e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		return pos;
	};

	Event.prototype.relatedTarget = function() {
		return this.e.relatedTarget || this.e.fromElement || this.e.toElement;
	};

	Event.prototype.which = function() {
		if (!this.e.which && this.e.button) {
			if (this.e.button & 1) return 0;      // Left
			else if (this.e.button & 4) return 1; // Middle
			else if (this.e.button & 2) return 2; // Right
		}
	};

	$.addEventHandler = (function () {
		if (window.addEventListener) {
			return function (el, ev, fn) {
				el.addEventListener(ev, fn, false);
            };
        } else if (window.attachEvent) {
            return function (el, ev, fn) {
				el.attachEvent('on' + ev, function () {
					fn(new Event(window.e));
				});
			};
        } else {
            return function (el, ev, fn) {
				el['on' + ev] =  function () {
					fn(new Event(window.e));
				};
			};
		}
	}());

	$.addClass = (function () {
		if (document.documentElement.classList) {
			return function (el, classStyle) {
				el.classList.add(classStyle);
			};
		}else{
			return function (el, classStyle) {
				var c = ' ' + el.className + ' ';
				if (c.indexOf(' ' + classStyle + ' ') == -1) {
					el.className += ' ' + classStyle;
				}
			};
		}
	}());

	$.removeClass = (function () {
		if (document.documentElement.classList) {
			return function (el, classStyle) {
				el.classList.remove(classStyle);
			};
		}else{
			return function (el, classStyle) {
				el.className = el.className.replace(new RegExp('\\b' + classStyle + '\\b','g'), '');
			};
		}
	}());

	$.classStyle = (function() {
		if (document.getElementsByClassName) {
			return function(classStyle, scope) {
				var dom = scope || document;
				return dom.getElementsByClassName(classStyle);
			};
		} else if (document.querySelector) {
			return function(classStyle, scope) {
				var dom = scope || document;
				return dom.querySelectorAll('.' + classStyle);
			};
		} else return function(classStyle, scope) {
			var result = [],
				dom = scope || document,
				elements = dom.getElementsByTagName('*');
			for (var i = 0, len = elements.length; i < len; i++) {
				if ((' ' + elements[i].className + ' ').indexOf(classStyle) !== -1) {
					result.push(elements[i]);
				}
			}
			return result;
		};
	}());

	//start create editor

	$.code = function (opt) {

		/*
			opt:
				target: element contains code
				language: javascript etc.
				tabSpace: change Tab to spaces. default 4.
				pre: a bool value indicate whether if the target element is wrapped by <pre> tag.
				lineNumber: determine whether to show line number
		*/
		opt.tabSpace   = opt.tabSpace || 4;
		opt.language   = opt.language || 'javascript';
		opt.pre        = opt.pre || true;
		opt.lineNumber = opt.lineNumber || true;
		opt.style      = opt.style || 'dark';

		return {
			code: opt.target.innerHTML,
			opt: opt,
			on: function () {
				var stream      = new $.Stream($.unescapeHTML(this.code)),
					lexer       = $.lexer[this.opt.language],
					tokens      = lexer.scan(stream, this.opt),
					htmlContent = '<div class="code">',
					pre			= this.opt.pre;

				for (var i = 0, len = tokens.length; i < len; i++) {
					var token = tokens[i];
					htmlContent += (token.type === $.Stream.EOL)?'<br />':$.spanStyle(token.text, lexer.map[token.type], pre);
				};
				this.opt.target.innerHTML = htmlContent + '</div>';
				if (this.opt.lineNumber) {
					$.addLineNumber(this.opt.target, stream.lines.length);
				}
				var code = $.classStyle('code', this.opt.target)[0];
				$.addClass(code, this.opt.language);
				$.addClass(this.opt.target, this.opt.style);
				$.addClass(this.opt.target, 'code-lighter');
			},
			off: function () {
				$.removeClass(this.opt.target, this.opt.style);
				$.removeClass(this.opt.target, 'code-lighter');
				// for ie6/7/8, line breaks '\n' will be ignored so there will be only one line
				// var t = document.createElement('div');
				// t.innerHTML = '\n';

				//if ( t.innerHTML === '\n' ){
				this.opt.target.innerHTML = this.code;
				//}
			}
		};

	};

	var autoFlag = false;
	$.auto = function (opt) {
		opt = opt || {};
		opt.tabSpace   = opt.tabSpace || 4;
		opt.pre        = opt.pre || true;
		opt.lineNumber = opt.lineNumber || true;
		opt.style      = opt.style || 'dark';

		var language;
		var elements = document.getElementsByTagName('*');
		for (var i = elements.length - 1; i >= 0; i--) {
			language = elements[i].getAttribute('codelighter');
			if (language) {
				var stream      = new $.Stream($.unescapeHTML(elements[i].innerHTML)),
					lexer       = $.lexer[language],
					tokens      = lexer.scan(stream, opt),
					htmlContent = '<div class="code">',
					pre			= opt.pre;

				for (var j = 0, len = tokens.length; j < len; j++) {
					var token = tokens[j];
					htmlContent += (token.type === $.Stream.EOL)?'<br />':$.spanStyle(token.text, lexer.map[token.type], pre);
				};
				elements[i].innerHTML = htmlContent + '</div>';
				if (opt.lineNumber) {
					$.addLineNumber(elements[i], stream.lines.length);
				}
				var code = $.classStyle('code', elements[i])[0];
				$.addClass(code, language);
				$.addClass(elements[i], opt.style);
				$.addClass(elements[i], 'code-lighter');
			}

		}
	}

	$.Line = function(text, state) {
        this.text   = text;
        this.state  = state;
    };

    $.Stream = function(text) {
        this.number = 0;
        this.pos = 0;
        this.lines = this.splitLines(text);
    };

    $.Stream.EOL = -1;
    $.Stream.EOF = -2;

    $.Stream.prototype.read = function() {
        if (this.number < this.lines.length) {
            if (this.pos < this.lines[this.number].length) {
                return this.lines[this.number].charAt(this.pos++);
            } else {
                // reset to line start and move to next line
                this.pos = 0;
                this.number++;
                return $.Stream.EOL;
            }
        } else {
            return $.Stream.EOF;
        }
    };

    $.Stream.prototype.putBack = function() {
        if (this.pos === 0) {
            this.pos = this.lines[--this.number].length;
        } else {
            this.pos--;
        }
    };

    $.Stream.prototype.pick = function() {
		if (this.number < this.lines.length) {
			if (this.pos < this.lines[this.number].length) {
				return this.lines[this.number].charAt(this.pos);
			} else {
				return $.Stream.EOL;
			}
		} else {
			return $.Stream.EOF;
		}
	};

	$.Stream.prototype.match = function(matchString) {
		return this.lines[this.number].indexOf(matchString,this.pos) === this.pos;
	};

	$.Stream.prototype.setLine = function(text, number) {
		this.lines[number] = text;
	};

	$.Stream.prototype.addLine = function(text, number) {
		if (number === undefined) {
			this.lines.push(new $.Line(text , null));
		}else{
			this.lines.splice(number,0, new $.Line(text, null));
		}
	};

	$.Stream.prototype.getLine = function(number) {
		if (number < this.lines.length) {
			return this.lines[number];
		}else{
			return null;
		}
	};

	$.Stream.prototype.setCursor = function(number) {
		
	};

	$.Stream.prototype.splitLines = (function(){
		return ('\n\nb'.split(/\n/).length != 3)? function(string) {
		    var pos = 0, result = [], l = string.length;
			while (pos <= l) {
				var nl = string.indexOf('\n', pos);
				if (nl == -1) {
					nl = string.length;
				}
				var line = string.slice(pos, string.charAt(nl - 1) == '\r' ? nl - 1 : nl);
				var rt = line.indexOf('\r');
				if (rt != -1) {
					result.push(line.slice(0, rt));
					pos += rt + 1;
				} else {
					result.push(line);
					pos = nl + 1;
				}
			}
    		return result;
    	} : function(string){
    		return string.split(/\r\n?|\n/);
    	};
    }());

	$.spanStyle = function (text, classStyle, pre) {
		// if (!pre) {
		// 	text = $.escapeHTML(text);
		// }
		return '<span class="' + classStyle + '">' + $.escapeHTML(text) + '</span>';
	};

	$.prepareLayer = function () {

	};

	$.type = {};

	$.type.inRange = function (num, min, max) {
		return (num >= min && num <= max);
	};

	$.type.isNum = function (c) {
		return ($.type.inRange(c, '0', '9'));
	};

	$.type.isAlpha = function (c) {
		return ($.type.inRange(c, 'a', 'z') || $.type.inRange(c, 'A', 'Z'));
	};

	$.type.isWhite = function (c) {
		return (c === '\t' || c === ' ');
	};

	$.escapeHTML = function (content) {
		return content
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/ /g, "&nbsp;")
		.replace(/>/g, "&gt;");
	};

	$.unescapeHTML = function (content) {
		return content
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&nbsp;/g, ' ')
		.replace(/&gt;/g, '>');
	};

	$.addLineNumber = function (target, n) {
		var html = [];
		for (var i = 1; i <= n; i++) {
			html.push('<span class="line-number">' + i + '</span>');
		}
		var doc = document.createElement("div");
		$.addClass(doc, 'aside');
		doc.innerHTML = html.join("");

		target.insertBefore(doc, target.firstChild);
	};

	$.classStyle = (function() {
		if (document.getElementsByClass) {
			return function(classStyle, scope) {
				var dom = scope || document;
				return dom.getElementsByClass(classStyle);
			};
		} else if (document.querySelector) {
			return function(classStyle, scope) {
				var dom = scope || document;
				return dom.querySelectorAll('.' + classStyle);
			};
		} else return function(classStyle, scope) {
			var result = [],
				dom = scope || document,
				elements = dom.getElementsByTagName('*');
			for (var i = 0, len = elements.length; i < len; i++) {
				if ((' ' + elements[i].className + ' ').indexOf(classStyle) !== -1) {
					result.push(elements[i]);
				}
			}
			return result;
		};
	}());

	return $;

}());
