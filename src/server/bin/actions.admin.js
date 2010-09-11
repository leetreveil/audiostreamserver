include('ringo/webapp/response');
include('core/string');
include('./folderProcessor');
var folders = require('./config').monfolders;
var db = require('./config').database;

exports.monitoredfolders = function (req,id){
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
			return jsonResponse(folders[id]);
		}
		else{
			return jsonResponse(folders[id]);
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
		
		return jsonResponse(folders);
	}
}