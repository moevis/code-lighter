'use strict';

var lighter = (function () {

	var lighter = this;

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
		if (this.e.pageX || this.e.pageY) 	{
			pos[0] = this.e.pageX;
			pos[1] = this.e.pageY;
		} else if (this.e.clientX || this.e.clientY) 	{
			pos[0] = this.e.clientX + document.body.scrollLeft
				+ document.documentElement.scrollLeft;
			pos[1] = this.e.clientY + document.body.scrollTop
				+ document.documentElement.scrollTop;
		}
		return pos;
	};

	Event.prototype.relatedTarget = function() {
		return this.e.relatedTarget || this.e.fromElement || this.e.toElement;
	};

	Event.prototype.which = function() {
		if (!e.which && e.button) {
		if (e.button & 1) return 0;      // Left
		else if (e.button & 4) return 1; // Middle
		else if (e.button & 2) return 2; // Right
	}

	lighter.on = function (opt) {
		var editor = {
			target: opt.target,
			language: opt.language
		};

		lighter.connect();
	}

	lighter.connect = function (event, element, handler) {

	};

	return lighter;
}());