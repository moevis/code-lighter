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


	//start create editor

	$.on = function (opt) {
		var editor = {
			target: opt.target,
			language: opt.language
		};

		var stream = new $.Stream(editor.target.value),
			lexer = $.lexer[editor.language],
			displayLayer = document.createElement('div'),
			tokens = lexer.scan(stream);

		editor.target.parentNode.insertBefore(displayLayer,editor.target);

		var htmlContent = '';

		tokens.forEach(function (token, i) {
			htmlContent += $.spanStyle(token.text, lexer.map[token.type]);
		});

		displayLayer.innerHTML = htmlContent;

		$.addEventHandler(editor.target, 'click', function (e) {
			console.log(e);
		});

		$.addEventHandler(editor.target, 'keyup', function (e) {
			console.log(e);
		});
	};

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
                return this.lines[this.number][this.pos++];
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
				return this.lines[this.number][this.pos];
			} else {
				return $.Stream.EOL;
			}
		} else {
			return $.Stream.EOF;
		}
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

	$.Stream.prototype.splitLines = function (text) {
		return text.split(/\r\n?|\n/g);
	};

	$.spanStyle = function (text, classStyle) {
		return (classStyle !== "WHITE")?('<span class="' + classStyle + '">' + $.escapeHTML(text) + '</span>'): ($.escapeHTML(text));
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
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
	};

	return $;

}());
