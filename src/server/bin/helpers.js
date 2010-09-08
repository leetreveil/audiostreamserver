var fs = require("fs");
var {format} = require("ringo/utils");

export('listFiles');

//Recursively walk a directory tree and return a list of all matching files with extensions
function listFiles(path, fileExtensions){
	path = path === '' ? '.' : String(path);
    var result = [];
    safeList(path).forEach(function (child) {
        var childPath = fs.join(path, child);
        if (fs.isDirectory(childPath)) {
			result.push.apply(result, listFiles(childPath,fileExtensions));
        } else { // Add files.
			for (var i = 0; i < fileExtensions.length; i++){
				//TODO: convert fileExtensions array to regex string
				var regExt = format("\{}$",fileExtensions[i]);
				if (child.match(regExt)){
					result.push(childPath);
					break;
				}
			}
        }
    });
    return result;
}

//ignores folders it cannot list and does not throw an exception (modified from fs-base.js)
function safeList(path){
    var file = resolveFile(path);
    var list = file.list();
	var result = [];
    if (list != null) {
		for (var i = 0; i < list.length; i++) {
			result[i] = list[i];
		}
    }
    return result;
}

var File = java.io.File;

/**
 * Internal. (copied from fs.js)
 */
function resolveFile(path) {
    // Fix for http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4117557
    // relative files are not resolved against workingDirectory/user.dir in java,
    // making the file absolute makes sure it is resolved correctly.
    if (path == undefined) {
        throw new Error('undefined path argument');
    }
    var file = file instanceof File ? file : new File(String(path));
    return file.isAbsolute() ? file : file.getAbsoluteFile();
}