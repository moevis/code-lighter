code-lighter
============

This is an extremely lightweight tool for code heighlighting.

Currently support highlighting for :

* javascript

No dependencies for other javascript library. Using token analysing instead of regex matching.

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
	pre: false					// whether if the code is wrapped by <pre> tag, default is true.
}

var code = lighter.code();
```

Then, Using `code.on()` to highlight the code. Using `code.off()` to disable highlight.

## License

MIT License
