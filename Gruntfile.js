'use strict';

module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';',
        stripBanners: true,
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */\n',
      },
      dist: {
        src: ['./lib/main.js', './lib/lexer.js'],
        dest: './dist/code-lighter.js'
      }
    },
    watch: {
      scripts: {
        files: ['lib/*.js']
      },
      task: ['concat']
    }
  });

  grunt.event.on('watch', function(action, filepath, target) {
    grunt.log.writeln(target + ': ' + filepath + ' has ' + action);
  });
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.registerTask('default', ['watch']);
  grunt.registerTask('cat', ['concat']);
};