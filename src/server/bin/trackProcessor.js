var log = require("ringo/logging").getLogger(module.id);
var db = require('./config').database;
var fs = require("fs");
var {format} = require("ringo/utils");
var base64 = require('ringo/base64');

export('processTrack');

function processTrack(filePath){
	var tag,track,albumName,albumArtist,album;

	tag = org.jaudiotagger.audio.AudioFileIO.read(new java.io.File(filePath)).getTag();	//get tag data
	track = getTrackMetaData(tag,filePath); //get just the metadata we need for the track	
	albumName = tag.getFirst(org.jaudiotagger.tag.FieldKey.ALBUM);	
	
	albumArtist = tag.getFirst(org.jaudiotagger.tag.FieldKey.ALBUM_ARTIST); //use the album artist if available
	
	if(albumArtist == null || albumArtist.length == 0 ){
		albumArtist =  track.Artist; //fallback to track artist
	}
			
	//album lookup (match on album title and album artist);
	album = lookupAlbum(albumName,albumArtist);
	
	if (!album){
		track.Id = getNewIdFor('track');
		album = {
			Id : getNewIdFor('album'),
			DateAdded : fs.lastModified(filePath),
			Artist : {Id : '', Name : albumArtist},
			Genre : {Id : '', Name : track.Genre},
			Title : tag.getFirst(org.jaudiotagger.tag.FieldKey.ALBUM),
			ReleaseYear : tag.getFirst(org.jaudiotagger.tag.FieldKey.YEAR),
			Tracks : [track]
		};
		
		//lookup artist and if artist is not found assign it a new Id
		var artistLookup = lookupArtist(albumArtist);
		album.Artist.Id = artistLookup ? artistLookup.Id : getNewIdFor('artist');

		var genreLookup = lookupGenre(track.Genre);
		album.Genre.Id = genreLookup ? genreLookup.Id : getNewIdFor('genre');
		
		//TODO: push the rendering and saving of artwork onto a separate thread
		var embeddedArtwork = getArtworkFromMetaData(tag);
		var renderedImage = embeddedArtwork ? embeddedArtwork : getArtworkFromFileSystem(filePath);
		if(renderedImage){
			javax.imageio.ImageIO.write(renderedImage,'png',new java.io.File('db/artwork/' + album.Id + '.png'));
		}
		
		db.albums.push(album);
	}
	else{
		//check the track has not already been added to this album, this may happen if the user
		//attempts to scan the same folder twice or a track is moved from one folder to another
		var albumTracks = album.Tracks;
		var found;
		for(var i = 0; i < albumTracks.length; i++){
			if(albumTracks[i].Title === track.Title){
				found = true;
				break;
			}
		}
		
		if (!found){
			track.Id = getNewIdFor('track');
			albumTracks.push(track);
		}
	}
	return album;
}

function lookupAlbum(albumName,albumArtist){
	for(var i = 0; i < db.albums.length; i++){
		var curAlbum = db.albums[i];	
		
		if (curAlbum.Title.toLowerCase() == albumName.toLowerCase() && 
			curAlbum.Artist.Name.toLowerCase() == albumArtist.toLowerCase()){
			return curAlbum;
		   }
	}
}

function lookupArtist(albumArtist){
	for(var i = 0; i < db.albums.length; i++){
		var curAlbum = db.albums[i];
		
		if(curAlbum.Artist.Name.toLowerCase() == albumArtist.toLowerCase()){
			return curAlbum.Artist;
		}
	}
	
	return null;
}

function lookupGenre(genre){
	for(var i = 0; i < db.albums.length; i++){
		var curAlbum = db.albums[i];
		
		if(curAlbum.Genre.Name.toLowerCase() == genre.toLowerCase()){
			return curAlbum.Genre;
		}
	}
	
	return null;
}

function getNewIdFor(objName){
	var ids,objId;
	ids = db.ids;
	
	if(ids == null){
		ids = {};
	}
	
	objId = ids[objName];
	
	if(objId != null){
		var currentIndex = parseInt(objId);
		currentIndex++;
		ids[objName] = currentIndex.toString();
	}else{
		ids[objName] = 1;
	}
	
	return objName + '_' + ids[objName]; //'track' + '_' + 1
}

function getTrackMetaData(tag,filePath){
	return {
		FilePath : filePath,
		Artist : tag.getFirst(org.jaudiotagger.tag.FieldKey.ARTIST),
		Title : tag.getFirst(org.jaudiotagger.tag.FieldKey.TITLE),
		Genre : convertGenreToString(tag.getFirst(org.jaudiotagger.tag.FieldKey.GENRE)),
		TrackNumber : convertDiscTrackIndexToInt(tag.getFirst(org.jaudiotagger.tag.FieldKey.TRACK),0),
		DiscNumber : convertDiscTrackIndexToInt(tag.getFirst(org.jaudiotagger.tag.FieldKey.DISC_NO),1),
	};
}

function getArtworkFromMetaData(tag){
	//get image from track metadata otherwise look on the filesystem
	var embeddedArtwork = tag.getFirstArtwork();
	
	if(embeddedArtwork != null){
		var inputStream = new java.io.ByteArrayInputStream(embeddedArtwork.getBinaryData());
		var bufImage = javax.imageio.ImageIO.read(inputStream);
		return resizeImage(bufImage,100,100);
	}
}

function getArtworkFromFileSystem(filePath){
	var path,imagePath;
	path = fs.Path(filePath);
	imagePath = path.directory().join('folder.jpg').toString();	//TODO: check case sensitivity on mac / linux
	
	if(fs.exists(imagePath)){
		var bufImage = javax.imageio.ImageIO.read(java.io.File(imagePath));
		return resizeImage(bufImage,100,100);
	}
}

function resizeImage(bufferedImage,width,height){
	//TODO: OPTIMIZE FOR FILE SIZE
	var resizedImage = new java.awt.image.BufferedImage(width, height, java.awt.image.BufferedImage.TYPE_INT_ARGB);
	var g = resizedImage.createGraphics();
	g.setRenderingHint(java.awt.RenderingHints.KEY_INTERPOLATION,
                       java.awt.RenderingHints.VALUE_INTERPOLATION_BICUBIC);
	g.drawImage(bufferedImage, 0, 0, width, height, null);
	g.dispose();
	
	return resizedImage;
}

//converts genre(0) to 0
function convertGenreToString(genre){
	var regEx = new RegExp("\\d+");
	var result  = regEx.exec(genre);
	
	if (genre.match(regEx)){
		return genres[parseInt(result[0])];
	}
	else{
		return genre;
	}
}

//converts 1/11 to 1 and 2/2 to 2
function convertDiscTrackIndexToInt(input,defaultNumber){
	var regEx = new RegExp("^\\d{1,2}");
	var result = regEx.exec(input);
	
	if (input.match(regEx)){
		return parseInt(result[0]);
	}
	else{
		return defaultNumber;
	}
}

var genres = ['Blues','Classic Rock','Country','Dance','Disco','Funk','Grunge','Hip-Hop',
			'Jazz','Metal','New Age','Oldies','Other','Pop','R&B','Rap','Reggae','Rock',
			'Techno','Industrial','Alternative','Ska','Death Metal','Pranks','Soundtrack',
			'Euro-Techno','Ambient','Trip-Hop','Vocal','Jazz+Funk','Fusion','Trance',
			'Classical','Instrumental','Acid','House','Game','Sound Clip','Gospel','Noise',
			'Alt. Rock','Bass','Soul','Punk','Space','Meditative','Instrumental Pop',
			'Instrumental Rock','Ethnic','Gothic','Darkwave','Techno-Industrial',
			'Electronic','Pop-Folk','Eurodance','Dream','Southern Rock','Comedy','Cult',
			'Gangsta Rap','Top 40','Christian Rap','Pop/Funk','Jungle','Native American',
			'Cabaret','New Wave','Psychedelic','Rave','Showtunes','Trailer','Lo-Fi','Tribal',
			'Acid Punk','Acid Jazz','Polka','Retro','Musical','Rock & Roll','Hard Rock',
			'Folk','Folk/Rock','National Folk','Swing','Fast-Fusion','Bebob','Latin','Revival',
			'Celtic','Bluegrass','Avantgarde','Gothic Rock','Progressive Rock','Psychedelic Rock',
			'Symphonic Rock','Slow Rock','Big Band','Chorus','Easy Listening','Acoustic','Humour',
			'Speech','Chanson','Opera','Chamber Music','Sonata','Symphony','Booty Bass','Primus',
			'Porn Groove','Satire','Slow Jam','Club','Tango','Samba','Folklore',
			'Ballad','Power Ballad','Rhythmic Soul','Freestyle','Duet','Punk Rock','Drum Solo',
			'A Cappella','Euro-House','Dance Hall','Goa','Drum & Bass','Club-House',
			'Hardcore','Terror','Indie','BritPop','Negerpunk','Polsk Punk','Beat',
			'Christian Gangsta Rap','Heavy Metal','Black Metal','Crossover','Contemporary Christian',
			'Christian Rock','Merengue','Salsa','Thrash Metal','Anime','JPop','Synthpop'];