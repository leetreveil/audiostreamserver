var playlistedAlbum;
var currentSongId; //the currently playing songs id
var repeatEnabled; //if the currently playing track should be looped


function PlayTrack(trackId) {

    AddAlbumToPlaylist();

    if (currentSongId == trackId) {
        //if we try to replay the same track do not destroy it
        soundManager.setPosition(trackId, 0);
        soundManager.play(trackId);
    }
    else if (currentSongId) {
        soundManager.destroySound(currentSongId);
    }

    $("#playlist_button").attr("src", "images/playlist_default.png");

    var sound = soundManager.createSound({
        id: trackId,
        autoPlay: true,
        url: '/track?id=' + trackId,
        onload: function () {
            if (this.loaded == false) {
                //unset the currently highlighted track
                $("#left3").find("a").css("color", '');
                $("#left3").find("a").find("img").remove();

                $("#playlist_" + trackId).prepend('<img style="padding-left:5px;float:left;display:inline;margin-top:20px" src="images/error.png" width="18" height="17"/>');
                $("#" + trackId).prepend('<img style="padding-left:5px;float:left;display:inline;margin-top:10px" src="images/error.png" width="18" height="17"/>');
		
            	//update the length of the track once its fully loaded instead of using the estimate
            	var output = convertMilisecondsToTimeSignature(this.duration);
            	$('#audio_display_duration').attr('textContent', output);	
            }
        },
        onid3: function () {
            //add the id3 data as it comes, need to do something if it never does
            $('#audio_display_artist_title').attr('textContent', this.id3.artist + " - " + this.id3.songname);
        },
        whileplaying: function () {
            var output = convertMilisecondsToTimeSignature(this.position);
            $('#audio_display_currentposition').attr('textContent', output);

            // we could use a percentage but using the width of the trackbar
            // gives us more granularity, should just jquery to get the width of the trackbar
            //instead of hard-coding
            var percentPlaying = Math.ceil(this.position / this.durationEstimate * 230);
            $('#audio_display_track_progress').css('width', percentPlaying + 'px');
        },
        whileloading: function () {
            //update the length of the track as its loading
            var output = convertMilisecondsToTimeSignature(this.durationEstimate);
            $('#audio_display_duration').attr('textContent', output);

            //update load progress
            var percentLoaded = Math.ceil(this.bytesLoaded / this.bytesTotal * 230);
            $('#audio_display_track_load').css('width', percentLoaded + 'px');
        },
        onplay: function () {
            currentSongId = trackId;

            //unset the currently highlighted track
            $("#left3").find("a").css("color", '');
            $("#left3").find("a").find("img").remove();

            if (this.readyState == 1 || this.readyState == 3) {
                $('#audio_controls_playpause').attr('src', 'images/controls_pause_default.png');
                //update artwork in audio display when track is played
                $('#audio_display_artwork').attr('src', 'db/Artwork?id=' + loadedAlbum.AlbumId);

                //remove the currently playing track highlight from the playlist
                // $.each($(".nowplaying"),function(index,value){
                // $(value).removeAttr('class');
                // $(value).find('img').remove();
                // });

                //highlight the currently playing track in the playlist
                $("#playlist_" + trackId).prepend('<img src="images/track_nowplaying.png" width="18" height="17"/>');
                $("#" + trackId).prepend('<img style="vertical-align:middle;padding-left:5px;float:left;display:inline;margin-top:8px" src="images/track_nowplaying.png" width="18" height="17"/>');
                $("#" + trackId).css("color", '#F10DA2');
                $("#playlist_" + trackId).css("color", '#F10DA2');
            }
        },
        onfinish: function () {
            var output = convertMilisecondsToTimeSignature(0);
            $('#audio_display_currentposition').attr('textContent', output);
            $('#audio_display_track_progress').css('width', '0px');
            if (repeatEnabled) {
                PlayTrack(trackId);
            }
            else {
                //play next track in the playlist
                PlayNextTrackFromPlaylist();
            }
        }

    });
}
function PlayNextTrackFromPlaylist() {
    var nextTrack;
    $.each(playlistedAlbum.Tracks, function (i, value) {
        if (value.Id == currentSongId) {
            //found currently playing track in playlist
            //play the next one
            if (i + 1 === playlistedAlbum.Tracks.length) {
                nextTrack = playlistedAlbum.Tracks[0];
            }
            else {
                nextTrack = playlistedAlbum.Tracks[i + 1];
            }
        }
    });

    PlayTrack(nextTrack.Id);
}
function AddAlbumToPlaylist() {
    playlistedAlbum = loadedAlbum;
    $("#playlist").empty();
    $("#playlist").append("#playlist_track", loadedAlbum.Tracks);
}

function PlayPauseAudio() {
    var sound = soundManager.togglePause(currentSongId);

    if (sound.paused) {
        $('#audio_controls_playpause').attr('src', 'images/controls_play_default.png');
    }
    else {
        $('#audio_controls_playpause').attr('src', 'images/controls_pause_default.png');
    }
}

function CreatePlaylist(tracks) {
    var results = [];

    $.each(tracks, function (i, value) {
        results[i] = {
            Title: value.Title,
            Artist: value.Artist,
            FilePath: value.FilePath,
            Id: value.Id
        };
    });

    return results;
}

$(function(){
   $('#audio_display_track').hover(function () {
        $('#audio_display_track_thumb').css('height', '9px');
        $('#audio_display_track_thumb').css('width', '3px');
        $('#audio_display_track_thumb').css('background-color', 'black');
        $('#audio_display_track_thumb').css('top', '-2px');
    }, function () { resetThumbStyle(); });

    $('#vol_control').hover(function () {
        $('#vol_control_thumb').css('height', '9px');
        $('#vol_control_thumb').css('width', '3px');
        $('#vol_control_thumb').css('background-color', 'black');
        $('#vol_control_thumb').css('top', '-2px');
    }, function () { resetThumbStyle(); });

    $('#audio_controls_back').hover(function () {
        $(this).attr('src', 'images/controls_back_mouseover.png');
    }, function () {
        $(this).attr('src', 'images/controls_back_default.png');
    });

    $('#audio_controls_forward').hover(function () {
        $(this).attr('src', 'images/controls_forward_mouseover.png');
    }, function () {
        $(this).attr('src', 'images/controls_forward_default.png');
    });

    $('#audio_controls_repeat').toggle(function () {
        $(this).attr('src', "images/controls_repeat_enabled.png");
        repeatEnabled = true;
    }, function () {
        $(this).attr('src', "images/controls_repeat_default.png");
        repeatEnabled = false;
    });

    $('#audio_display_track_load').click(function (e) {
        setAudioPosition(e.offsetX);
    });

    $('#audio_display_track_progress').click(function (e) {
        setAudioPosition(e.offsetX);
    });

    function resetThumbStyle() {
        $('#audio_display_track_thumb').css('height', '100%');
        $('#audio_display_track_thumb').css('width', '1px');
        $('#audio_display_track_thumb').css('background-color', 'white');
        $('#audio_display_track_thumb').css('top', '0px');
    }

    //if the audio display image cannot be loaded revert to the blank one
    $('#audio_display_artwork').error(function () {
        $(this).attr('src', 'images/blankartwork.png');
    });
	
	    $("#playlist_button").click(function (e) {
        var ele = $("#playlist_popup");

        if (ele.css('display') == 'block') {
            ele.css('display', 'none');
        }
        else {
            ele.css("display", "block");
            ele.css("right", "20px");
            ele.css("bottom", "80px");
        }
    });
});

function setAudioPosition(currentPos) {
	var computedSongPosition = Math.floor(currentPos / 230 * soundManager.load(currentSongId).duration);
	soundManager.setPosition(currentSongId, computedSongPosition);
}
//converts miliseconds to 4:48 / 0:03 etc
//hours not implemeted yet
function convertMilisecondsToTimeSignature(miliseconds) {
    var o = miliseconds;
    var t = parseInt(o / 1000, 10);
    var h = Math.floor(t / 3600);
    t %= 3600;
    var m = Math.floor(t / 60);
    var s = t % 60;

    var output = m + ':' + (s < 10 ? '0' + s : s);

    return output;
}