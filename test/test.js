function isEven(val) {
	return val % 2 === 0;
}

var func = 'function (arg) {\n//body...\n}';


test('lighter.stream', function() {

	var stream = new lighter.Stream(func);
	var index = 0;
	equal(stream.lines.length , 3, 'parse to 3 lines');
	equal(stream.read() , func[index] , 'get first char: ' + func[index++]);
	equal(stream.read() , func[index] , 'get second char: ' + func[index++]);
	equal(stream.pick() , func[index] , 'pick third char: ' + func[index]);
	equal(stream.read() , func[index] , 'get third char: ' + func[index]);
	stream.putBack();
	equal(stream.read() , func[index] , 'after putBack(), get char: ' + func[index]);

	while(stream.read() != lighter.Stream.EOL) {}

	equal(stream.number , 1, 'switch to line 1');
	
});

test('lighter.type', function() {

	ok( lighter.type.isWhite('\t'), 'isWhite \\t');
	ok( lighter.type.isWhite(' '), 'isWhite \\n');
	
});

test('lighter.lexer.javascript', function() {

	var stream = new lighter.Stream(func);
	var lexer = lighter.lexer.javascript;

	equal(lexer.scan(stream)[0].text, 'function', 'First token');
	
});