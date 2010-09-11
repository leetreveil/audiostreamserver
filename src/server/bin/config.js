exports.httpConfig = {
    staticDir: './static',
	port: '8080',
};

exports.urls = [
    ['/', './actions'],
	['/admin', './actions.admin']
];

exports.middleware = [
	'ringo/middleware/gzip',
    'ringo/middleware/etag',
    //'ringo/middleware/responselog',
    'ringo/middleware/error',
    'ringo/middleware/notfound',
    // 'ringo/middleware/profiler',
];

exports.app = require('ringo/webapp').handleRequest;

exports.macros = [
    'ringo/skin/macros',
    'ringo/skin/filters',
];

exports.charset = 'UTF-8';
exports.contentType = 'text/html';

addToClasspath(getResource('jars/jaudiotagger-2.0.3-SNAPSHOT.jar').path);
//suppress log messages from jaudiotagger
java.util.logging.LogManager.getLogManager().readConfiguration(new java.io.StringBufferInputStream("org.jaudiotagger.level = OFF"));


var fs = require('fs');

//album database
var dbPath = 'db/db.json';
var db = {};
db.ids = {};
db.albums = [];
if(fs.exists(dbPath)){
	db = JSON.parse(fs.read(dbPath));
};
db.save = function(){
	fs.write(dbPath,JSON.stringify(db));
};

exports.database = db;

//monitored folders
var monfoldersPath = 'db/monitoredfolders.json';
var monfolders = [];
if(fs.exists(monfoldersPath)){
	monfolders = JSON.parse(fs.read(monfoldersPath));
};
monfolders.save = function(){
	fs.write(monfoldersPath,JSON.stringify(monfolders));
};

exports.monfolders = monfolders;


//setup db folder
if(!fs.exists('db')){
	fs.makeDirectory('db');
}

//setup artwork folder
if(!fs.exists('db/artwork')){
	fs.makeDirectory('db/artwork');
}

var log = require("ringo/logging").getLogger(module.id);

//check for incompleted folder scans
for (var i=0; i < monfolders.length; i++){
	var folder = monfolders[i];
	
	if(folder.status == 'SCANNING'){
		log.info('a previous folder scan did not finish!, rescanning...');
		require('./folderProcessor').rescanFolder(folder.id);
	}
}


