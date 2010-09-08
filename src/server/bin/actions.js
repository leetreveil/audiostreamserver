include('ringo/webapp/response');
var {JSONQuery} = require("JSONQuery");
var base64 = require('ringo/base64');
var albums = require('./config').database.albums;
var {format} = require("ringo/utils");

exports.index = function (req) {
	return staticResponse('static/index.htm');
};

exports.db = function (req){
	var query, results, escaped;
	
	escaped = unescape(req.params.query);
	//if the query is null or empty just return all albums in the database (for testing only!!!)
	query = req.params.query ? JSONQuery(escaped,albums) : albums
	//perform second query to filter down to only the selected elements if a range is passed
	results = req.params.range ? JSONQuery(req.params.range,query) : query;

	return jsonResponse({TotalResults :  query.length, Results : results});
};

exports.artwork = function (req){
	return staticResponse(format('db/artwork/{}.png',req.params.id));
};

exports.track = function (req){
	//just sending the file with downloading and play no streaming (yet)
	return staticResponse(unescape(req.params.path));
};