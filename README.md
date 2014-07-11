code-lighter
============

This is an extremely lightweight tool for code heighlighting.

Currently support highlighting for :

* javascript
* html

No dependencies for other javascript library. Using token analysing instead of regex matching.

preview
![alt tag](https://github.com/icymorn/code-lighter/blob/master/preview.png)

## Simple usage

first, include the css and code-lighter.js.

HTML code

```
		<div id="area">
			//comment
			function helloworld() {
				for (var i = 0; i < 10; i++) {
					console.log(i);
				}
				alert("hello");
			}
		</div>
```

javascript initializing:
```
var option = {
	target: document.querySelector('#area'),	// target element
	language: 'javascript',
	tabSpace: 4,					// change a '\t' char to spaces, default is 4 spaces.
	lineNumber: true				// add line number to the code
}

var code = lighter.code();
```

Then, Using `code.on()` to highlight the code. Using `code.off()` to disable highlight.

## License

MIT License
