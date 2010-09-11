include('ringo/scheduler');
var {listFiles} = require('helpers');
var folders = require('./config').monfolders;
var db = require('./config').database;
var log = require("ringo/logging").getLogger(module.id);
var {format} = require("ringo/utils");
var fs = require("fs");

exports.startMonitoringFolder = function(path){
	folders.push({'path' : path, 'status' : 'SCANNING'});
	folders.save();//save monitored folders before scan
	var folder = folders[folders.length -1];
	
	scanFolder(folder.path);
	
	folder.status = "UPTODATE";
	folders.save();
	
	return folders.length -1;
}

exports.rescanFolder = function(id){
	var folder = folders[id];
	scanFolder(folder.path);
	folder.status = "UPTODATE";
	folders.save();
}

exports.stopMonitoringFolder = function(id){
	var folder = folders[id];
	
	for(var i = db.albums.length -1; i >=0; i--){
		var curAlbum = db.albums[i];	
		
		//delete tracks
		for(var x = curAlbum.Tracks.length -1; x >= 0; x--){
			var curTrack = curAlbum.Tracks[x];
			
			if(curTrack.FilePath.startsWith(folder.path)){
				curAlbum.Tracks.splice(x,1);
			}
		}
		
		//once all tracks are deleted from the album, delete the artwork and the album
		if(db.albums[i].Tracks.length == 0){
			log.info('removing album {}',curAlbum.Title);
			try{
				fs.remove(format('db/artwork/{}.png',curAlbum.Id));
			}
			catch(e){
				log.error(e);
			}

			db.albums.splice(i,1);
		}
	}
	
	db.save();
	folders.splice(id,1);
}

function scanFolder(path){
	var exts,listings,tracks;
	
	//TODO: extend supported file types
	listings = listFiles(path,['.mp3']);
	tracks = [];
	
	var intervalId = setInterval(function(){
		log.info("persisting database...");
		db.save();
	},30000);
	

	for (var i = 0; i < listings.length; i++){
		var filePath = listings[i];
		log.info('processing track {} of {}',i + 1,listings.length);
		try{
			tracks.push(require('trackProcessor').processTrack(filePath));
		}catch(e){
			log.error(e);
		}
		
	}
	clearInterval(intervalId);
	db.save();
}