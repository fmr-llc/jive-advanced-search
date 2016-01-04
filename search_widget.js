/*
Jive - Enhanced Search Widget Library

Copyright (c) 2015 Fidelity Investments
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

FILE DESCRIPTION
This is the JavaScript library that drives the Search widgets.

WIDGET DESCRIPTION
This Jive HTML widget which creates an alternate widget to the standard Jive 
search. The standard search allows for a global search, or searching the current 
container (Group, Space, etc.). This widget provides a more configurable search that
allows multiple containers to be searched. This widget will use the underlying Jive 
search APIs for surfacing the search criteria.
*/
var fidosreg_id = 'b764a0a9536448345dc227af95e192521d337b5e4c3560c859b89ecd0407004a';
var searchRequest = null;

// Change "false" to "true" if you are going to put this into a thin widget layout
var useSmallSearch = false;
if(document.documentElement.clientWidth < 225){
	useSmallSearch = true;
}

var parentWindow = window.parent.document;
var parentIframe = $j("iframe",parentWindow);
var searchURL = '';
var searchResultTotal = '';
var inputBoxSearch = 'jive-search-terms';

//Hack for IE8
var isIE =new Boolean(false);
var ua = window.navigator.userAgent;
var msie = ua.indexOf("MSIE ");
var IEVersion = parseInt(ua.substring(msie + 5, ua.indexOf(".", msie)));
if(IEVersion <= 8) {
	isIE = true;
}

var insertHTML = "<div id='startingDiv' style='display:inline'>\n"
			   + "<div id='search_layout'>\n"
			   + "<div id='customsearchform' name='customsearchform' onsubmit='return false;'>\n"
			   + "<input id='jive-search-terms'  type='text'  placeholder='Search'/>\n"
			   + "<br /><br />\n"
			   + "<span id='nextStartIndex' style='display:none;'>1</span>\n"
			   + "<span id='prevStartIndex' style='display:none;'>1</span>\n"
			   + "<div id='search_loader' style='display:none;'>\n"
			   + "<br />\n"
			   + "<p>Searching...</p>\n"
			   + "<br />\n"
			   + "</div>\n"
			   + "<div id='searchResultArea' style='display:none;'>\n"
			   + "Showing \n"
			   + "<span id='number_results'></span> Results:\n"
			   + "<div id='custom_places_search_results2'></div>\n"
			   + "<p>\n"
			   + "<br />\n"
			   + "<span id='previousResults' style='display:none;'>\n"
			   + "<a href='#' onclick=\"runSearch	(document.getElementById('prevStartIndex').innerHTML);\">prev</a>\n"
			   + "</span>&nbsp;\n"
			   + "<span id='nextResults' style='display:none;'>\n"
			   + "<a href='#' onclick=\"runSearch	(document.getElementById('nextStartIndex').innerHTML);\">next</a>\n"
			   + "</span> &nbsp;\n"
			   + "<span id='clearResults' style='display:none;'>\n"
			   + "<a href='#' onclick=\"clearResults();\">clear</a>\n"
			   + "</span>\n"
			   + "</p>\n"
			   + "</div>\n"
			   + "</div>\n"
			   + "</div>\n"
			   + "</div>\n";

/*
 * This is required because Jive malforms json responses to prevent cross site injection attacks
 */
jQuery.ajaxSetup({
	dataFilter: function(data, type) {
		return type === 'json' ? jQuery.trim(data.replace(/^throw [^;]*;/, '')) : data;
	}
});

/*
 * This is required because Jive malforms json responses to prevent cross site injection attacks
 */
function initSafe(){
	getParentCss();
	resizeAutoLoad();
	setUpSearch();
}

/*
 * Function for quick search type ahead search
 */
function setUpSearch(){
	$j('#jive-search-terms').keyup(function(e) {
		clearTimeout($j.data(this, 'timer'));
		if (e.keyCode == 13)
			keyupSearch(true);
		else
			$j(this).data('timer', setTimeout(keyupSearch, 300));
	});
}

/*
 * Function for quick search type ahead search
 */
function keyupSearch(force) {
	var existingString = $j("#jive-search-terms").val();
	if (!force && existingString.length < 3) return; //wasn't enter, not > 2 char
	$j('#search_loader').show();
	$j('#searchResultArea').hide();
	runSearch	()
}

/*
 * Sets the search entry debounce and resizes the widget
 */
function resizeAutoLoad() {
	if(isIE==true && useSmallSearch==true){
		$j("#search_layout").css({ "width":"175px"});
	} else {
		//Resizing code
		function window_resize_debounce(fn, timeout){
			var timeoutID = -1;
			return function() {
				if (timeoutID > -1) {
					parent.window.clearTimeout(timeoutID);
				}
				timeoutID = window.setTimeout(fn, timeout);
			}
		}

		// Debounce the user resizing the window so that the resize only happens once the user has stopped resizing for 250ms
		var window_resize = window_resize_debounce(function() {
			setWidgetIframeSize();
		}, 250);

		// Capture the window resize event and call the debounce function.
		$j(window).resize(window_resize);
	}
} //resizeAutoLoad

function getParentCss() {
	if (parent) {
		var oHead = document.getElementsByTagName("head")[0];
		var arrStyleSheets = parent.document.getElementsByTagName("link");

		for (var i = 0; i < arrStyleSheets.length; i++)
			oHead.appendChild(arrStyleSheets[i].cloneNode(true));
	} 
	
	if(isIE == true){
		$j("#search_layout").css({'margin-top':'5px',"margin-left":"5px", "padding-top": "5px",  "padding-bottom": "15px", "padding-left": "5px", "padding-right": "5px" });
	} 
	document.body.style.paddingLeft='0px';
	resizeWidget();
} //getParentCss


function setWidgetIframeSize() {
	document.getElementById('search_layout').style.width = document.documentElement.clientWidth + "px";
}//setWidgetIframeSize


/*
 * Resize the widget based on content size after waiting 100ms
 */
function resizeWidget(){
	setTimeout(resizeMe,100);
}

/*
 * Reset the widget for a new search
 */
function clearResults(){
	$j('#searchResultArea').hide();
	$j('#nextResults').hide();
	$j('#previousResults').hide();
	resizeWidget();
	$j('#jive-search-terms').attr('value', '');
}

/*
 * function to perform search
 */
function runSearch	(startIndex) {
	
	var searchResultItem;
	searchResultTotal = '';
	
	//get the search term from the input box
	var query_val = document.getElementById(inputBoxSearch).value;

	// Go through all configured places and determine which ones the user has access to
	var authorizedPlaces = '';
	var places = searchPlaces.replace(/\s+/g, '').split(',');
	$j.each(places, function(index, place) {
		$j.ajax({
			type: "GET",
			url: '/api/core/v3' + place,
			async: false,
			dataType: "json",
			success: function (data) {
				if (authorizedPlaces.length) {
					authorizedPlaces += ',';
				}
				authorizedPlaces += place;
			}
		}); //ajax
	}); //each

	if (authorizedPlaces.length) {
		
		// Set the URL of the API we are going to call, including the index into the return list
		searchURL = "/api/core/v3/search/contents?filter=place(" + authorizedPlaces + ")&filter=search(" + query_val + "*)&count=" + searchCount + '&collapse=true' + additionalFilters;
		if(startIndex) {
			searchURL += '&startIndex=' + startIndex;
		}

		// If a previous ajax call (search) was made, abort it
	    if(searchRequest) {
	        searchRequest.abort();
	        searchRequest = null
	    }
	    //set the search variable so that only its return is used and all previous returns are ignored
	    searchRequest = $j.ajax({
			type: "GET",
			url: searchURL,
			dataType: "json",
			success: function (data) {
				
				searchResultTotal = '<ol role="listbox2" aria-labelledby="header_content">';
				
				var listLength = data.list.length; // the total number of elements found in the current query
				var responseStartIndex = data.startIndex; // The returned startindex from the web service call
				
				//console.log('responseStartIndex=' + responseStartIndex + ' - searchCount=' + searchCount + ' - listLength=' + listLength);
				
				// create next/previous URL's
				if(searchCount == listLength) {
					$j('#nextResults').show();
					$j('#nextStartIndex').html(responseStartIndex + searchCount); //Set the startIndex on the page for the next and previous URL's
				} else {
					$j('#nextResults').hide();
				}
				
				// Show/Hide the previous link
				if(responseStartIndex > 0) {
					$j('#prevStartIndex').html(responseStartIndex - searchCount);
					$j('#previousResults').show();
				} else {
					$j('#previousResults').hide();
				}
				
				// display the search result area
				$j('#searchResultArea').show();
				
				// Loop over the json array and pull out specific items to build a list of search results		
				$j.each(data.list, function() {
					
					//Display the proper icon for the content type				
					var content_type = '';
					switch(this.type) {
						case 'idea':
						content_type = '<span class="jive-icon-med jive-icon-idea" role="img" title="Idea"></span>';
						break;
						case 'event':
						content_type = '<span class="jive-icon-med jive-icon-event" role="img" title="event"></span>';
						break;
						case 'message':
						content_type = '<span class="jive-icon-med jive-icon-discussion" role="img" title="discussion"></span>';
						break;
						case 'file':
						content_type = '<span class="jive-icon-med jive-icon-document-upload" role="img" title="file"></span>';
						break;	
						case 'favorite':
						content_type = '<span class="jive-icon-med jive-icon-bookmark" role="img" title="bookmark"></span>';
						break;
						case 'poll':
						content_type = '<span class="jive-icon-med jive-icon-poll" role="img" title="poll"></span>';
						break;
						case 'post':
						content_type = '<span class="jive-icon-med jive-icon-blog" role="img" title="blog"></span>';
						break;
						case 'document':
						content_type = '<span class="jive-icon-med jive-icon-document" role="img" title="document"></span>';
						break;
						case 'comment':
						content_type = '<span class="jive-icon-med jive-icon-comment" role="img" title="comment"></span>';
						break;
						case 'announcement':
						content_type = '<span class="jive-icon-med jive-icon-announcement" role="img" title="announcement"></span>';
						break;
						default:
						content_type = '<span class="jive-icon-med jive-icon-document" role="img" title="Document"></span>';
					}

					// Trim the date returned by Jive
					var dateTrim = this.updated.indexOf("T");
					var dateOnlyUpdated = this.updated.substr(0,dateTrim);
					
					// If useSmallSearch is true then just show the title
					if(useSmallSearch) {
						searchResultItem = '<li role="option" class="j-listitem2" data-component="listitem"><p><a class="j-result-bookmark2" href="' + this.resources.html.ref + '" target="_blank" title="' + this.subject + '">' + content_type + '<span class="result-title2" style="word-wrap: break-word;">' + this.subject + '</span></a></li>';
					} else {
						// For a larger widget area use this code
						searchResultItem = '<li role="option" class="j-listitem2" data-component="listitem"><p><a class="j-result-bookmark2" href="' + this.resources.html.ref + '" target="_blank" title="' + this.subject + '">' + content_type + '<span class="result-title2">' + this.subject + '</span><em class="font-color-meta-light"> in ' + this.parentPlace.name + '</em></p><em class="font-color-meta-light" style="margin-left:22px;"> by ' + this.author.name.formatted + ', updated ' + dateOnlyUpdated + '</em></a></li>';				
					}
					
					// Add the item to the total result
					searchResultTotal = searchResultTotal + '<p>' + searchResultItem + '</p>';
				}); //each


				// Hide the searching loading text
				$j('#search_loader').hide();
				
				// Set the value of the results div
				if(searchResultTotal == '') {
					$j('#custom_places_search_results2').html('<br /><p>No Results Found</p>');
				} else {
					searchResultTotal = searchResultTotal + '</ol>';
					$j('#custom_places_search_results2').html(searchResultTotal);
				}
				
				$j('#clearResults').show();
				
				// resize the iframe after the results are consolidated
				setTimeout(resizeMe,100);
				
				// Set pagination and number of results
				$j('#number_results').html(listLength);
				
				
			},
			error: function (xhr, ajaxOptions, thrownError){
				$j('#custom_places_search_results2').html("ERROR: " + thrownError);
			}
		}); //ajax
	} else {
		$j('#custom_places_search_results2').html("ERROR: You are not authorized to search any places here");
	}

	return false;
} //runSearch	