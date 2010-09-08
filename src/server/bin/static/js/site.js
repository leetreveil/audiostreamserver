var leftListId;
var loadedAlbum;

//id = genre id or artist id, null for everything, sortMode is the sortMode you want,
//sortOverride = no not skip to the next one, this is used for the carousel,
function GetAlbumsSortedBy(id, sortMode, sortOverride) {
    $('#loading_anim_albums').show();
    var sortModes = ['DATE ADDED', 'A TO Z', 'RELEASE YEAR', 'ARTIST'];

    leftListId = id;

    if (id !== null && id.startsWith("albumartists")) {
        //remove the artist because we do not need to display it when showing albums for an artist
        sortModes.splice(3, 1);
    }
    var theSortMode;

    if (sortOverride === false) {
        var idx = sortModes.indexOf(sortMode);
        if (idx == sortModes.length - 1) {
            theSortMode = sortModes[0];
        }
        else {
            theSortMode = sortModes[idx + 1];
        }
    }
    else {
        theSortMode = sortMode;
    }
	
	//todo: remove hardcoded album width values and get real values
	var xAlbums = Math.floor($("#albums").width() / 130);
	var yAlbums = Math.ceil($("#albums").height() / 161)
	//+ 1 row to prevent the div from scrolling while albums are loading
	var numAlbsToGet =  xAlbums * yAlbums + xAlbums;
	
	if(theSortMode === 'ARTIST'){
		numAlbsToGet = yAlbums;
	}

    switch (theSortMode) {
        case "DATE ADDED":
            QueryAlbumsSortedByDateAdded(id, 0,numAlbsToGet, function (result) {
                if (id !== null && id.length > 0) {
                    UpdateView(CreateAlbumObjectsWithNoHeaderingsForArtists(result, 'DATE ADDED', id));
                }
                else {
                    UpdateView(CreateAlbumObjectsWithNoHeaderings(result, 'DATE ADDED'));
                }
            });
            break;
        case "A TO Z":
            QueryAlbumsSortedByAlbumTitle(id, 0,numAlbsToGet, function (result) {
                if (id !== null && id.length > 0) {
                    UpdateView(CreateAlbumObjectsWithNoHeaderingsForArtists(result, 'A TO Z', id));
                }
                else {
                    UpdateView(CreateAlbumObjectsWithNoHeaderings(result, 'A TO Z'));
                }
            });
            break;
        case "RELEASE YEAR":
            QueryAlbumsSortedByReleaseYear(id, 0, numAlbsToGet, function (result) {
                if (id !== null && id.length > 0) {
                    if (id.startsWith('albumartists')) {
                        UpdateView(CreateAlbumObjectsWithNoHeaderingsForArtists(result, 'RELEASE YEAR', id));
                    }
                    else {
                        UpdateView(CreateAlbumObjectsWithYearHeadersForGenres(id, result, 'RELEASE YEAR'));
                    }
                }
                else {
                    UpdateView(CreateAlbumObjectsWithYearHeaders(result, 'RELEASE YEAR'));
                }
            });
            break;
        case "ARTIST":
            QueryAlbumsSortedByArtist(id, 0,numAlbsToGet, function (result) {
                if (id !== null && id.length > 0) {
                    //just for genres
                    UpdateView(CreateAlbumObjectsWithArtistHeadersForGenres(id, result, 'ARTIST', id));
                }
                else {
                    UpdateView(CreateAlbumObjectsWithArtistHeaders(result, 'ARTIST'));
                }
            });
    }

    function UpdateView(result) {
		//render header
		$("#middle_header").remove();
        $("#content").append("#tmpl_albums_container", result);
		
		$("#albums > .inner").empty();
		//render results
		$.each(result.AlbumsOrHeaders,function(idx,value){
			if(value.IsContent === false){
				$("#albums > .inner").append("#tmpl_album_header",value);
			}
			else{
				RenderAlbumToView($("#albums > .inner"),value.Content);
			}
		});
		
		//for the first row of albums we need to remove the top padding
		
		//infinite scroll
		var elem = $('#albums')
        elem.scroll(function () {
			if (elem[0].scrollHeight - elem.scrollTop() == elem.outerHeight()) {
				console.log("getting more albums...");
				GetMoreAlbums(leftListId);
			}
        });

		
        $('#loading_anim_albums').hide();
    }
}

//renders a single album tile to view and applys effects etc
function RenderAlbumToView(selector, albumJson){
	selector.append("#tmpl_album", albumJson);
	var imageSelector = "#" + albumJson.Id;
	$(imageSelector).imageAsync();

	//TODO: poor performance with 100s of albums on screen
	//hover effects
	$(imageSelector).hover(function () {
		$(this).children(".albumOverlay").animate({ 'opacity': '1' }, 100);
		$(this).css("-webkit-box-shadow", "0px 0px 5px #000");
		$(this).css("-moz-box-shadow", "0px 0px 5px #000");
		$(this).css("box-shadow", " 0px 0px 5px #000");
		//change text below to all black
		$(this).siblings('div').children('p').css("color",'black');
	}, function () {
		$(this).children(".albumOverlay").animate({ 'opacity': '0.0' }, 100);
		$(this).css("-webkit-box-shadow", null);
		$(this).css("-moz-box-shadow", null);
		$(this).css("box-shadow", null);
		$(this).siblings('div').children('p').css("color",null);
	});

	//play button mouse over
	$(imageSelector).find(".album_play_button").hover(function () {
		$(this).attr("src", 'static/images/album_play_mouseover.png');
	}, function () {
		$(this).attr("src", 'static/images/album_play_default.png');
	});
}

function GetAlbumsFor(id) {
    GetAlbumsSortedBy(id, $("#middle_header_sort_mode").text(), true);
}

function GetMoreAlbums(id) {
    $('#loading_anim_albums').show();
    var startIndex = $('#albums > .inner > .album').size();
    var sortedBy = $("#middle_header").find('a').text();

    switch (sortedBy) {
        case "DATE ADDED":
            QueryAlbumsSortedByDateAdded(id, startIndex,20, function (data) {
                UpdateView(CreateListOfAlbums(data.Results));
            });
            break;
        case "A TO Z":
            QueryAlbumsSortedByAlbumTitle(id, startIndex, function (data) {
                UpdateView(CreateListOfAlbums(data.Results));
            });
            break;
        case "RELEASE YEAR":
            QueryAlbumsSortedByReleaseYear(id, startIndex, function (data) {
                UpdateHeaderedView(CreateListOfAlbumsWithYearHeaders(data.Results));
            });
            break;
        case "ARTIST":
            QueryAlbumsSortedByArtist(id, startIndex, function (data) {
                UpdateHeaderedView(CreateListOfAlbumsWithArtistHeaders(data.Results));
            });
            break;
    }

    function UpdateView(result) { 		
		//render results
		console.log("rendering more results");
		for (var i=0; i<= result.length -1; i++){
			var current = result[i];
			
			if(current.IsContent === false){
				$("#albums").append("#tmpl_album_header",current);
			}
			else{
				RenderAlbumToView($("#albums > .inner"),current.Content);
			}
		}
		
        $('#loading_anim_albums').hide();
    }

    function UpdateHeaderedView(result) {
        if (result.length > 0) {
            //get the last year display
            var lastYear = $('#albums').find('h2').last();
            //remove the first header if its the same as the one displayed
            if (lastYear.text() == result[0].Content) {
                result.shift();
            }
        }

        UpdateView(result);
    }
}

function GetLeftList(listName) {
    $('#loading_anim_left').show();
    if (listName == 'Artists') {
        QueryArtists(function (result) {
            UpdateView(listName, result);
        });
    }

    if (listName == 'Genres') {
        QueryGenres(function (result) {
            UpdateView(listName, result);
        });
    }

    function UpdateView(listName, result) {
	
		function sorter(a,b){
			var x = a.Name.toLowerCase();
			var y = b.Name.toLowerCase();
			
			if(x.startsWith('the ')){
				x = x.substring(4);
			}
			if(y.startsWith('the ')){
				y = y.substring(4);
			}
			
			return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		}
		//TODO: sort results
		var viewModel = { 
			Total: result.TotalResults, 
			Header: listName.toUpperCase(), 
			LeftItems: result.Results.sort(sorter) 
			};
			
        $("#content").append("#tmpl_left_list", viewModel);
        $('#loading_anim_left').hide();


        var allLeftLinks = $("#left1 >ul").children();
        allLeftLinks.click(function (e) {
            //unset all
            $.each(allLeftLinks, function (index, value) { $(value).css('background-color', null); });
            //highlight current
			$(this).find("li").css("background-color", "#EDEDED");
        });
		
		$(document).keypress(function(event){
			var input = $("#txt_input");
			if(!input.is(":visible")){
				input.show();
				input.focus();
				input.val('');
			}
	});
	
	var searchText;
	var timeout;
	$("#txt_input").keyup(function(){
		console.log("keypress");
		console.log($("#txt_input").val());
		clearTimeout(timeout);
		
		searchText = $("#txt_input").val();

		function finished(){
			console.log("callback called");
			$('#txt_input').fadeOut('fast');
			Search(searchText);
		}
	
		timeout = setTimeout(finished,1000);
	});
    }
}

function GetBrowsePage(name) {
    GetLeftList(name);
    GetAlbumsSortedBy(null, 'DATE ADDED', true);
}

function LoadAlbum(albumId,playFirstTrack) {
    $('#loading_anim_tracks').show();
    QueryTracksByAlbum(albumId, function (result) {

        //get the album title from the dom, we can't pass it through the onclick event
        //because of certain characters
        var albumTitle = $("#" + albumId).find("p").first().text();

        var dataObject = {
            Total: result.TotalResults,
            HeaderText: "SONGS",
            AlbumTitle: albumTitle,
            Tracks: CreateHeaderedTracksOrNot(result.Results[0])
        };

        //everytime an album is loaded we need to store it so it can be retrieved later
        loadedAlbum = {
            AlbumId: albumId,
            Tracks: CreatePlaylist(result.Results[0])
        };

        $("#right").empty();
        $("#right").append("#tmpl_tracks_list", dataObject);

        //show the tracks pane
        $('#albums').css('width', '60%');
        $('#left3').css('left', '80%');

        $('#middle_header').css('width', '60%');
        $('#right_header').css('left', '80%');

        //turn off highlighting on all albums
        //$('#albums').find('.overlay').css('visibility', 'hidden');
        //$('#' + albumId).find('.overlay').css('visibility', 'visible');

        //we have to replace the / in the id because we cannot use / in jquery selector
        //we get Syntax error, unrecognized expression error
        $('#loading_anim_tracks').hide();

        var allTracks = $("#left3").find("a");
        allTracks.click(function (e) {
            //unset all
            $.each(allTracks, function (index, value) { $(value).find("li").css('background-color', null); });
            //highlight current
            $(this).find("li").css('background-color', "#EDEDED");
        });


        if (playFirstTrack) {
            PlayTrack(loadedAlbum.Tracks[0].Id);
        }
    });
}

function GetBrowseFrame(frameName) {
    var dataObject = { headers:
        [
            { orig_text: 'Artists', text: 'ARTISTS', active: false },
            { orig_text: 'Genres', text: 'GENRES', active: false },
            { orig_text: 'Albums', text: 'ALBUMS', active: false },
            { orig_text: 'Songs', text: 'SONGS', active: false }
        ]
    };

    //set the currently selected view type to active  
    $.each(dataObject.headers, function (index, value) {
        if (value.orig_text == frameName) {
            value.active = true;
        }
    });

    $("#content").empty();
    $("#content").append("#tmpl_header_frame", dataObject);
}

function LoadPage(pageName) {
    if (pageName == 'Albums' || pageName == 'Songs') {
        GetBrowseFrame(pageName);
        $('#browse_content').empty();
        $('<h1> NOT IMPLEMENTED</h1>').appendTo('#browse_content');
    }
    else {
        GetBrowseFrame(pageName);
        GetLeftList(pageName);
        GetAlbumsSortedBy(null, 'DATE ADDED', true);
    }
}
$(document).ready(function () {
    LoadPage("Artists");


    var loader = new ImageLoader('static/images/ZuneBackgrounds/Neuxe.png');
    loader.loadEvent = function (url, image) {
        $(image).attr('className', 'bg');
        document.body.appendChild(image);
    }

    loader.load();
});

function CreateAlbumObjectsWithYearHeaders(jsonData, sortMode) {
    var albumsWithYearHeaders = CreateListOfAlbumsWithYearHeaders(jsonData.Results);
    var sortText = CreateHeaderTextForAlbums(jsonData.TotalResults);

    return {
        Total: jsonData.TotalResults,
        SortText: sortText,
        SortMode: sortMode,
        AlbumsOrHeaders: albumsWithYearHeaders
    };
}

function CreateAlbumObjectsWithYearHeadersForGenres(id, jsonData, sortMode) {
    var albumsWithYearHeaders = CreateListOfAlbumsWithYearHeaders(jsonData.Results);
    var sortText = CreateHeaderTextForAlbums(jsonData.TotalResults);

    return {
        Total: jsonData.TotalResults,
        SortText: sortText,
        SortMode: sortMode,
        ArtGenId: id,
        AlbumsOrHeaders: albumsWithYearHeaders
    };
}

function CreateAlbumObjectsWithArtistHeaders(jsonData, sortMode) {
    var albumsWithArtistHeaders = CreateListOfAlbumsWithArtistHeaders(jsonData.Results);
    var sortText = CreateHeaderTextForAlbums(jsonData.TotalResults);

    return {
        Total: jsonData.TotalResults,
        SortText: sortText,
        SortMode: sortMode,
        AlbumsOrHeaders: albumsWithArtistHeaders
    };
}

function CreateAlbumObjectsWithArtistHeadersForGenres(id, jsonData, sortMode) {
    var albumsWithArtistHeaders = CreateListOfAlbumsWithArtistHeaders(jsonData.Results);
    var sortText = CreateHeaderTextForAlbums(jsonData.TotalResults);

    return {
        Total: jsonData.TotalResults,
        SortText: sortText,
        SortMode: sortMode,
        ArtGenId: id,
        AlbumsOrHeaders: albumsWithArtistHeaders
    };
}

function CreateAlbumObjectsWithNoHeaderings(jsonData, sortMode) {
    var albums = CreateListOfAlbums(jsonData.Results);
    var sortText = CreateHeaderTextForAlbums(jsonData.TotalResults);

    return {
        Total: jsonData.TotalResults,
        SortText: sortText,
        SortMode: sortMode,
        AlbumsOrHeaders: albums
    };
}

function CreateAlbumObjectsWithNoHeaderingsForArtists(jsonData, sortMode, id) {
    var albums = CreateListOfAlbumsWithSubReleaseYear(jsonData.Results);
    var sortText = CreateHeaderTextForAlbums(jsonData.TotalResults);

    return {
        Total: jsonData.TotalResults,
        SortText: sortText,
        SortMode: sortMode,
        ArtGenId: id,
        AlbumsOrHeaders: albums
    };
}

function CreateListOfAlbumsWithSubReleaseYear(results) {
    var albums = [];

    //create the albums
    $.each(results, function (index, value) {
        albums[index] = CreateAlbum(value, value.ReleaseYear);
    });

    return albums;
}

function CreateListOfAlbums(results) {
    var albums = [];

    //create the albums
    $.each(results, function (index, value) {
        albums[index] = CreateAlbum(value, value.Artist.Name);
    });

    return albums;
}

function CreateListOfAlbumsWithYearHeaders(results) {
    var albumsWithYearHeaders = [];

    $.each(results, function (index, value) {
        //if there is no year for the found year add it
        //and add all tracks that have that year
        if ($.inArray(value.ReleaseYear, albumsWithYearHeaders) == -1) {
            albumsWithYearHeaders.push(value.ReleaseYear);
            albumsWithYearHeaders.push(CreateAlbum(value, value.Artist.Name));
        }
        else {
            albumsWithYearHeaders.push(CreateAlbum(value, value.Artist.Name));
        }
    });

    //we have to convert the number to header
    //after everything is added because we cant use inArray on objects :(
    $.each(albumsWithYearHeaders, function (index, value) {
        if (typeof value === 'number') {
            albumsWithYearHeaders[index] = CreateHeader(value);
        }
    });

    return albumsWithYearHeaders;
}

function CreateListOfAlbumsWithArtistHeaders(results) {
    var albumsWithArtistHeaders = [];

    $.each(results, function (index, value) {
        //if there is no year for the found year add it
        //and add all tracks that have that year
        if ($.inArray(value.Artist.Name, albumsWithArtistHeaders) == -1) {
            albumsWithArtistHeaders.push(value.Artist.Name);
            albumsWithArtistHeaders.push(CreateAlbum(value, value.ReleaseYear));
        }
        else {
            albumsWithArtistHeaders.push(CreateAlbum(value, value.ReleaseYear));
        }
    });

    //we have to convert the number to header
    //after everything is added because we cant use inArray on objects :(
    $.each(albumsWithArtistHeaders, function (index, value) {
        if (typeof value === 'string') {
            albumsWithArtistHeaders[index] = CreateHeader(value);
        }
    });

    return albumsWithArtistHeaders;
}

function CreateAlbum(jsonData, subTitle) {
    return { IsContent: true,
        Content: {
            Title: jsonData.Title,
            SubTitle: subTitle,
            Id: jsonData.Id
        }
    };
}

function CreateHeader(text) {
    return { IsContent: false, Content: text };
}

function CreateHeaderTextForAlbums(length) {
    if (length == 1) {
        return "ALBUM BY";
    }
    if (length > 1) {
        return "ALBUMS BY";
    }
}

function CreateHeaderedTracksOrNot(tracks) {
    var justDiscs = [];

    $.each(tracks, function (index, value) {
        justDiscs[index] = value.DiscNumber;
    });

    if (justDiscs.distinct().length > 1) {
        return CreateListOfTracksWithDiscHeaders(tracks);
    }
    else {
        return CreateListOfTracksNoDiscHeaders(tracks);
    }
}

function CreateListOfTracksNoDiscHeaders(tracks) {
    var tracksArray = [];
    //create the tracks
    $.each(tracks, function (index, value) {
        tracksArray[index] = CreateTrack(value);
    });

    return tracksArray;
}

function CreateListOfTracksWithDiscHeaders(tracks) {
    var tracksArray = [];

    $.each(tracks, function (index, value) {
        if ($.inArray(value.DiscNumber, tracksArray) == -1) {
            tracksArray.push(value.DiscNumber);
            tracksArray.push(CreateTrack(value));
        }
        else {
            tracksArray.push(CreateTrack(value));
        }
    });

    //we have to convert the number to header
    //after everything is added because we cant use inArray on objects :(
    $.each(tracksArray, function (index, value) {
        if (typeof value === 'number') {
            var header = CreateHeader(value);
            header.Content = "Disc " + header.Content;
            tracksArray[index] = header;
        }
    });

    return tracksArray;
}

function CreateTrack(track) {
    return { IsContent: true,
        Content: {
            Id: track.Id,
            FilePath: escape(track.FilePath),
            TrackNumber: ConvertTrackNumberToDoubleDigits(track.TrackNumber),
            Title: track.Title
        }
    };
}

function ConvertTrackNumberToDoubleDigits(trackNumber) {
    var str = trackNumber.toString();

    if (str.length == 1) {
        return '0' + str;
    }
    else {
        return str;
    }
}

String.prototype.startsWith = function (str) {
    return (this.indexOf(str) === 0);
};

String.prototype.contains = function(str,fromIndex){
	return this.indexOf(str, fromIndex ? fromIndex : 0) > -1;
}

/**
 * A simple string formatter. If the first argument is a format string
 * containing a number of curly bracket pairs {} as placeholders,
 * the same number of following arguments will be used to replace the curly
 * bracket pairs in the format string. If the first argument is not a string
 * or does not contain any curly brackets, the arguments are simply concatenated
 * to a string and returned.
 *
 * @param {String} format string, followed by a variable number of values
 * @return {String} the formatted string
 */
function format() {
    if (arguments.length == 0) {
        return "";
    }
    var format = arguments[0];
    var index = 1;
    // Replace placehoder with argument as long as possible
    if (typeof format === "string") {
        if (format.contains("{}") && arguments.length > 1) {
            var args = arguments;
            format = format.replace(/{}/g, function(m) {
                return index < args.length ? args[index++] : m;
            });
        }
    } else {
        format = String(format);
    }
    // append remaining arguments separated by " "
    if (index < arguments.length) {
        return [format].concat(Array.slice(arguments, index).map(String)).join(" ");
    } else {
        return format;        
    }
}

Array.prototype.distinct = function () {
    var derivedArray = [];
    for (var i = 0; i < this.length; i += 1) {
        if ($.inArray(this[i], derivedArray) == -1) {
            derivedArray.push(this[i]);
        }
    }
    return derivedArray;
};