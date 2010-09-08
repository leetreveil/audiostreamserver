include('ringo/webapp/response');
include('ringo/scheduler');
include('core/string');
var log = require("ringo/logging").getLogger(module.id);
var {listFiles} = require('helpers');
var {processTrack} = require('trackProcessor');
var folders = require('./config').monfolders;
var db = require('./config').database;
var {format} = require("ringo/utils");
var fs = require("fs");



exports.monitoredfolders = function (req,id){
	//admin/monitoredfolders/1
	if(req.isGet){
		if(id){
			return jsonResponse(folders[id -1]);
		}
		else{
			return jsonResponse(folders);
		}
	}
	if(req.isPost){
		var path = unescape(req.params.path);
		
		//TODO: create some function that does this or find a ringojs func
		var foundAt = -1;
		for (var i=0; i< folders.length; i++){
			if(folders[i].path == path){
				foundAt =  i;
			}
		}
		
		if(foundAt == -1){
			var id = startMonitoringFolder(path);
			return redirectResponse('/admin/monitoredfolders/' + (id + 1));
		}
		else{
			return redirectResponse('/admin/monitoredfolders/' + (foundAt + 1));
		}
	}
	if(req.isDelete){
		//stop monitoring folder
		//delete data (including images)
		//remove from monfolders
		if(id){
			stopMonitoringFolder(id);
		}
		else{
			//if no id is passed then stop monitoring all folders
			for(var i = folders.length -1; i >= 0; i--){
				stopMonitoringFolder(folders[i].id);
			}
		}
		
		folders.save();
		
		return redirectResponse('/admin/monitoredfolders/');
	}
}

function startMonitoringFolder(path){
	folders.push({'id' : folders.length +1 , 'path' : path, 'status' : 'SCANNING'});
	//save details before scan
	folders.save();
	var id = folders.length -1;
	scanFolder(path);
	folders[id].status = "UPTODATE";
	//save details after scan
	folders.save();
	
	return id;
}

function stopMonitoringFolder(id){
	var path;
	var monitoredFolderIndex;
	
	//lookup folder path from id
	for(var i=0; i< folders.length; i++){
		if(folders[i].id == id){
			path = folders[i].path;
			monitoredFolderIndex = i;
			break;
		}
	}
	
	for(var i = db.albums.length -1; i >=0; i--){
		var curAlbum = db.albums[i];	
		
		//delete tracks
		for(var x = curAlbum.Tracks.length -1; x >= 0; x--){
			var curTrack = curAlbum.Tracks[x];
			
			if(curTrack.FilePath.startsWith(path)){
				curAlbum.Tracks.splice(x,1);
			}
		}
		
		//delete album & artwork
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
	
	folders.splice(monitoredFolderIndex,1);
}

function scanFolder(path){
	var exts,listings,tracks;
	
	//TODO: extend supported file types
	listings = listFiles(path,['.mp3']);
	tracks = [];
	
	for (var i = 0; i < listings.length; i++){
		try{
			var filePath = listings[i];
			log.info('processing track {} of {}',i,listings.length);
			tracks.push(processTrack(filePath));
		}catch(e){
			log.error(e);
		}
	}
}