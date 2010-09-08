var totalAlbumSearchResults;

function AddForwardButton(){
	var forwardButton = "<div id='forward_button_container' style='width:100px;height:100px;float:left;margin:10px'><img id='forward_button' onclick='GetResultOfSearchResultsForAlbums()' style='cursor:pointer;position:relative;top:50%;margin-top:-33px' src='images/forward.png' width='73' height='66'></div>";
	$('#search_albums').append(forwardButton);
	
	$('#forward_button').hover(function () {
		$(this).attr('src', 'images/forward_mouseover.png');
	}, function () {
		$(this).attr('src', 'images/forward.png');
	});
}

function Search(searchText) {
    var viewModel = { "SearchText": searchText.toUpperCase() };

    $("#content").empty();
    $('#content').append('#tmpl_search_frame', viewModel);

	QuerySearchForArtists(searchText,0,function(result){
		$('#search-artists').append('#tmpl_search_artists', result);
		$("#loading_anim_search_artists").hide();
	});
	
	QuerySearchForAlbums(searchText,0,function(result){
		$('#search-albums').append('#tmpl_search_albums', result);
		
		//render results
		$.each(result.Results,function(idx,value){
			RenderAlbumToView($('#search_albums'),value);
		});
		
		$("#loading_anim_search_albums").hide();
		totalAlbumSearchResults = result.TotalResults;
		
		var postMoreAlbumCount = $("#search_albums").children().length;
		if(postMoreAlbumCount < totalAlbumSearchResults){
			AddForwardButton();	
		}
		
	});
}

function GetResultOfSearchResultsForAlbums(){
	GetRestOfSearchResults('albums');
}

function GetRestOfSearchResults(type) {
	var searchInput = document.searchform.input.value;
	
	if (type == 'albums'){
		GetMoreSearchResultsForAlbums(searchInput);
	}
    if (type == 'artists') {
		GetRestOfSearchResultsForArtists(searchInput);
    }
}

function GetMoreSearchResultsForAlbums(searchString){
	//-1 is for the arrow link which we arent counting
	var albumCount = $("#search_albums").children().length -1;
	$("#loading_anim_search_albums").show();
	QuerySearchForAlbums(searchString,albumCount,function(result){
		$("#forward_button_container").remove();

		//render results
		$.each(result.Results,function(idx,value){
			RenderAlbumToView($('#search_albums'),value);
		});
		
		var postMoreAlbumCount = $("#search_albums").children().length;
		if(postMoreAlbumCount < totalAlbumSearchResults){
			AddForwardButton();	
		}
		
		$("#loading_anim_search_albums").hide();
	});
}

var artistMoreFirstTime = true;
var isArtistsExpanded = false;

function oneTimeOnly(){
	oneTimeOnly = function (){
		return false;
	}
	return true;
}

function GetRestOfSearchResultsForArtists(searchString){
	var expandImage = $("#search-artists").find('img');
	if(oneTimeOnly()){
		$("#loading_anim_search_artists").show();
		QuerySearchForArtists(searchString,5,function(result){
			$("#search_artists").append("#tmpl_search_artist",result.Results);			
			expandImage.attr('src','images/collapse.png');
			$("#loading_anim_search_artists").hide();
		});
	}
	//what to do after the query has been made each time the expand button is clicked
	else{
		var eles = $("#search-artists").find('li');
		isArtistsExpanded = !isArtistsExpanded;		
		if(isArtistsExpanded){
			//hide all elements apart from the first 5
			for ( var i = 4; i < eles.length; i++){
				$(eles[i]).hide();
			}		
			expandImage.attr('src','images/back_small_notselected.png');	
		}
		else{
			eles.show();
			expandImage.attr('src','images/collapse.png');	
		}
	}
}                        


