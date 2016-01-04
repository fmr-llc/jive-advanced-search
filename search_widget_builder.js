/* 
Jive - Search Widget Builder

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
This is the JavaScript library that drives the Search Widget Builder app.

WIDGET DESCRIPTION
This Jive HTML widget which creates an alternate widget to the standard Jive 
search. The standard search allows for a global search, or searching the current 
container (Group, Space, etc.). This widget provides a more configurable search that
allows multiple containers to be searched. This widget will use the underlying Jive 
search APIs for surfacing the search criteria.
*/
var fidosreg_id = 'b764a0a9536448345dc227af95e192521d337b5e4c3560c859b89ecd0407004a';
var searchString = 'jive.global.containerBrowseId = ';
var parentString = 'parent.jive.global.containerBrowseId';
var titleString = '<title>';			
var findSeachPlaces = 'var searchPlaces =';
var findSearchCount = 'var searchCount =';			
var findJiveSearchTermsStyle = '#jive-search-terms {';
var findJiveSearchTermsStyleRadius = 'border-radius:';
var searchPlaces = '';			
var searchCount = 5;
var smallSearch = false;
var borderRadius = '';
var box1BorderRadius = '7px 7px 7px 7px';
var box2BorderRadius = '0';
var box3BorderRadius = '15px 15px 15px 15px';
var currentBorderRadius = box1BorderRadius;
var childrenArray = new Array();
var outstandingAjaxGets = 0;
var totalNumberPlacesToSearch = 0;
var overResultMax = false;
var tempIdValue = '';
var isDuplicateLocation = false;
var instanceHostname = '';

/*
 * This is required because Jive malforms the json response to prevent cross site injection attacks
 */
jQuery.ajaxSetup({
	dataFilter: function(data, type) {
		return type === 'json' ? jQuery.trim(data.replace(/^throw [^;]*;/, '')) : data;
	}
});//ajax setup

/*
 * Look up the place containerID given the URL
 */
function getContainerID(searchURL){				
	searchURL = searchURL.toLowerCase();
	if(searchURL.indexOf(instanceHostname) != -1){					
		
		//Disable all of the input until the page and all it's children are found
		$j('#inputUrlField').attr('readonly', true);
		$j('#addIdButton').attr('disabled', true);
		$j('#getContainerStatus').text('Retrieving your location...');
		$j('#getContainerStatus').css({'border-style': 'none' });
		
		//Destroy any lingering children
		childrenArray = [];
		
		isDuplicateLocation = false;
		
		//Update the children count to '0'
		$j('#childCountDiv').html(childrenArray.length);
		
		//reset the overResultMax if it was due to the children search last time
		if(totalNumberPlacesToSearch < 100){
			overResultMax = false;
		}
		
		$j.ajax({
			type: 'GET',
			url: searchURL,
			dataType: 'html',
			success: function (data) {							
				if(data){
					
					var idLocation = data.indexOf(searchString) + searchString.length;
					var titleLocation = data.indexOf(titleString) + titleString.length;
					var returnVal = '';
					var returnText = '';
					
					if(idLocation != -1){
						
						if(titleLocation != -1){
						
							//get the element between the <title> tags
							returnText += (data.substring(titleLocation, data.indexOf('</title>', titleLocation)));
							
							//remove everything after the ' | ' from the end of the titles
							returnText = returnText.substring(0,returnText.indexOf(' | '));
						}
						
						//parse out the containerBrowseId 
						returnVal += data.substring(idLocation, data.indexOf(';', idLocation));
						
						tempIdValue = returnVal;
						
						addIdToListBox(returnVal, returnText);
						
						//start the recursive function
						getChildrenRecursiveFunction('/api/core/v3/places/' + returnVal.replace(/'/g,""), 0);
						
					}else{
						$j('#getContainerStatus').text('No ID Found');
						$j('#getContainerStatus').css({'border-style': 'solid', 'border-color': 'red', 'border-radius': '5px', 'padding': '2px' });
					}
				}
			},
			error: function (xhr, ajaxOptions, thrownError){						
				enableUrlInput();
				$j('#getContainerStatus').text('Invalid URL');
				$j('#getContainerStatus').css({'border-style': 'solid', 'border-color': 'red', 'border-radius': '5px', 'padding': '2px' });	
				toggleAddButton();							
			},
			complete: function(){
			}
		});					
	}else{
		enableUrlInput();
		$j('#getContainerStatus').text('Invalid URL');
		$j('#getContainerStatus').css({'border-style': 'solid', 'border-color': 'red', 'border-radius': '5px', 'padding': '2px' });
		toggleAddButton();
	}
}//getContainerID()			


/*
 * Find the child containers of the given place
 */
function getChildrenRecursiveFunction(urlIncoming, iteration){		
	if(overResultMax == true ){
		return false;
	}			
	$j.ajax({
		type: "GET",
		url: urlIncoming,
		dataType: "json",					
		beforeSend: function(){
			outstandingAjaxGets = outstandingAjaxGets + 1;					
		},					
		success: function (data) {
			if(data){	
			
				//if there are more then one page of results
				if(data.links){								
					var nextPage = (JSON.stringify(data.links.next));
					if(nextPage){
						nextPage = nextPage.replace(/"/g, "");
						getChildrenRecursiveFunction(nextPage, iteration);
					}
				}
				
				//if top level, user input url
				if(iteration == 0){
					if(data.resources) {
						//get the url where the child pages are displayed
						var location = JSON.stringify(data.resources.places.ref);
						var pageName = JSON.stringify(data.name);
						
						//if there is a url with child pages
						if(location.length != 0){
						
							//remove the quotes that json puts around the url
							location = location.replace(/"/g, "");
							//addToChildrenArray(location, pageName);
							
							//increment iteration
							iteration = 1;
							
							//recursively call the function with this new location and
							//the next level of iteration
							getChildrenRecursiveFunction(location, iteration);
						}
					} else {
						return;
					}
					
				//if page of places that are children of user entered url
				}else{// if(iteration == 1){
					iteration = iteration + 1;
					
					//get the array of results
					var dataList = data.list;
					
					//if that array isn't empty
					if(dataList.length != 0){
					
						//for each item in the array
						$j.each(dataList,function(){

							//get the number of children that each place has
							var childNumber = (JSON.stringify(this.childCount));										
							var pageName = JSON.stringify(this.type) + ': ' + JSON.stringify(this.name);
							
							if(childNumber && childNumber > 0){										
								//grab the location of the page with it's children on it
								var location = (JSON.stringify(this.resources.places.ref));
								
								if(location.length != 0){
					
									//remove the quotes that json puts around the url
									location = location.replace(/"/g, "");
									
									//add the page to the array
									addToChildrenArray(location, pageName);												
									
									//recursively call the function with this new location and
									//the next level of iteration
									getChildrenRecursiveFunction(location, iteration);
								}//location
								
							//If the page has no children, add itself to the list
							}else{
								var location = (JSON.stringify(this.resources.self.ref));
								if(location.length != 0){
									
									//Blogs should not be added, they are automatically
									//searched from the parent
									if(this.type != 'blog'){
										//remove the quotes that json puts around the url
										location = location.replace(/"/g, "");
										addToChildrenArray(location, pageName);
									}
								}//location
							}//childNumber
						});//foreach
					}//dataList
				}//iteration number
			}//if(data)
		},
		error: function (xhr, ajaxOptions, thrownError){
			//alert(thrownError);
		},
		complete: function(){		
		
			outstandingAjaxGets = outstandingAjaxGets - 1;
			
			if (outstandingAjaxGets == 0){
				if(childrenArray.length > 0) {
					
					if(overResultMax == true){
						childrenArray = [];
						$j('#childCountDiv').html("<font color='red'>Over 100</font>");
						$j('#addChildrenButton').attr('disabled',true);
						divShowAddChildren();
					}else{
							
							//Loop over the childrenArray to make sure that none of the 
							//children already exist in the places to search, if they
							//do, remove them from the array
							for (var i = childrenArray.length - 1; i >= 0; i--){ 
								var child = childrenArray[i];								
								if($j('#locationSelectArea').find('option[value=' + child[0] +']' ).length != 0 ){
									childrenArray.splice(i, 1);
								}
							} 
							if(childrenArray.length > 0) {
								divShowAddChildren();
								//Update the number of children in the GUI
								$j('#childCountDiv').html(childrenArray.length);
								$j('#addChildrenButton').attr('disabled',false);
							} else if(isDuplicateLocation == false) {
								dontAddChildrenToBox();
							}
							//If there is at least one child, allow the user to add the 
							//children to the list of places to search
					}
				} else if(isDuplicateLocation == false) {
						dontAddChildrenToBox();
				}
			}//outstandingAjaxGets
		}//complete
	});//ajax get
}//getChildrenRecursiveFunction()


function generateCode() {
	searchPlaces = '';
	$j('#locationSelectArea > option').each(function() {
		if(this.value == parentString){
			searchPlaces += '/places/\' + ' + this.value +' + \', ';
		}else{
			searchPlaces += '/places/' + this.value +', ';
		}
	});
	searchPlaces = searchPlaces.substring(0,searchPlaces.length - 2);
	
	$j('#generatedCodeBox').val( "<scr"+"ipt src='/resources/scripts/jquery/jquery.js'></scr"+"ipt>\n"
								 + "<scr"+"ipt src='/api/core/v3/attachments/file/" + library_loader_content_id + "/data'></scr"+"ipt>\n"
								 + "<scr"+"ipt>\n"
								 + "$j.include_library('search_widget.css');\n"
								 + "$j.include_library('search_widget.js');\n"
								 + "var searchPlaces = '" + searchPlaces +"'; \n"
								 + "var searchCount = " + searchCount +"; \n"							
								 + "var borderRadius = '" + currentBorderRadius + "'; \n"
								 + "var additionalFilters = '';\n"
								 + "$j(function() {\n"
								 + "$j('#mainContentDiv').html(insertHTML);\n"
								 + "});\n"
								 + "$j(document).ready(function(){\n"
								 + "initSafe();\n"
								 + "$j('#jive-search-terms').css({'border-radius': borderRadius });\n"
								 + "});\n"
								 + "</scr"+"ipt>\n"
								 + "<div id='mainContentDiv'></div>\n");

	showGeneratedCode();
}//generateCode


/*
*Functions to make changed to generated code
*/
function updateNumberOfPlacesToSearch(){
	totalNumberPlacesToSearch = $j('#locationSelectArea').children().length;
	$j('#count').html(totalNumberPlacesToSearch);
}//updateNumberOfPlacesToSearch


function changeNumberOfResults(){
	searchCount = $j('#dropBoxNumberResults').val();
}// changeNumberOfResults()	


/*
* Child Container Functions
*/

function addToChildrenArray(url, title){
	if(totalNumberPlacesToSearch > 100 || childrenArray.length > 100){
		overResultMax = true;					
	}else{
		var newUrl;
		//check if the url is a page, or a list of pages
		if(url.charAt(url.length - 1).match(/[0-9]/)){					
			 newUrl = url.substring(url.lastIndexOf('\/') + 1, url.length);
			
		}else{
		//remove the '/places' from the end of the url
			newUrl = url.substring(0, url.length - 7);
			newUrl = newUrl.substring(newUrl.lastIndexOf('\/') + 1, newUrl.length);
		}
		
		
		//make sure title is there, if not list ID as title
		if(title.legnth != 0){
			//remove the quotes that json puts around the page name
			title = title.replace(/"/g, "");					
		}else{									
			title = newUrl;
		}					
		
		childrenArray.push([newUrl,title]);
	}
}//addToChildrenArray


function addChildrenToBox(){
	$j.each(childrenArray, function( index, child ) {				
		addIdToListBox(child[0], child[1]);					
	});
	enableUrlInput();
	tempIdValue = '';
	childrenArray = [];
	$j('#addChildrenButton').attr('disabled',true);
	$j('#childCountDiv').html(childrenArray.length);
	clearContainerStatus();
	toggleRemoveButton();
	divShowlListBoxlocations();				
}//addChildrenToBox


function dontAddChildrenToBox(){

	enableUrlInput();

	tempIdValue = '';
	childrenArray = [];
	$j('#addChildrenButton').attr('disabled',true);
	$j('#childCountDiv').html(childrenArray.length);
	clearContainerStatus();
	toggleRemoveButton();
	divShowlListBoxlocations();				
}//dontAddChildrenToBox



/*
* List Box Manipulations
*/
function addIdToListBox(returnVal, returnText){			
	if($j('#locationSelectArea').find('option[value=' + returnVal + ']').length == 0){					
		$j('#locationSelectArea').append("<option value = " + returnVal + ">" + returnText + "</option>");
		$j("#getContainerStatus").text("Success");
		$j("#getContainerStatus").css({"border-style": "solid", "border-color": "green", "border-radius": "5px", "padding": "2px" });
		updateNumberOfPlacesToSearch();
		return true;
	}else{
		//Don't add it again
		$j('#addIdButton').attr('disabled', false);
		$j('#inputUrlField').attr('readonly', false);
		$j('#inputUrlField').val('');
		toggleAddButton();
		 $j("#getContainerStatus").text("Duplicate Location");
		 $j("#getContainerStatus").css({"border-style": "solid", "border-color": "orange", "border-radius": "5px", "padding": "2px" });	
		tempIdValue = '';					 
		isDuplicateLocation = true;
		return false;					 
	}
}//addIdToListBox


function removeIdFromBox( idToRemove ){				
	if($j('#locationSelectArea').find('option[value=' + idToRemove + ']' ).remove()){//;
		toggleRemoveButton();					
		clearContainerStatus();
		updateNumberOfPlacesToSearch();
		if($j('#locationSelectArea').children().length == 0){
			$j('#searchUrlDiv').show();
			$j('#childrenDiv').hide();				
			$j('#customDesignDiv').hide();				
			$j('#childrenDiv').hide();				
			$j('#addAnotherUrlDiv').hide();
			$j('#listBoxDiv').hide();

			childrenArray = [];
			enableUrlInput();
			clearContainerStatus();
			toggleAddButton();
			resizeWidget();
		}
	}
}//removeIdFromBox


function removeAllFromBox(){
	if(window.confirm("This will clear all of your search places and start over.") == true){
		$j('#locationSelectArea').empty();
		updateNumberOfPlacesToSearch();
		return true;
	}else{
		return false;
	}
}//removeAllFromBox


/*
* Visual Styling Code
*/

function showGeneratedCode(){
	$j('#customDesignDiv').hide();
	$j('#generatedCodeDiv').show( function() {
		$j('#generatedCodeBox').select();
		resizeWidget();
	});						
}//showGeneratedCode


function backToEditMode(){
	$j('#searchUrlDiv').show();
	$j('#generatedCodeDiv').hide();
}//backToEditMode


function previousBox(){
	if($j(box1).css("display") != "none" ) {
		$j(box1).css({"display": "none"});
		$j(box3).css({"display": "inline" });
		currentBorderRadius = box3BorderRadius;
	} else if($j(box2).css("display") != "none" ) {
		$j(box2).css({"display": "none"});
		$j(box1).css({"display": "inline" });
		currentBorderRadius = box1BorderRadius;
	} else if($j(box3).css("display") != "none" ) {
		$j(box3).css({"display": "none"});
		$j(box2).css({"display": "inline" });
		currentBorderRadius = box2BorderRadius;
	}
}//previousBox


function nextBox(){
	if($j(box1).css("display") != "none" ) {
		$j(box1).css({"display": "none"});
		$j(box2).css({"display": "inline" });
		currentBorderRadius = box2BorderRadius;
	} else if($j(box2).css("display") != "none" ) {
		$j(box2).css({"display": "none"});
		$j(box3).css({"display": "inline" });
		currentBorderRadius = box3BorderRadius;
	} else if($j(box3).css("display") != "none" ) {
		$j(box3).css({"display": "none"});
		$j(box1).css({"display": "inline" });
		currentBorderRadius = box1BorderRadius;
	}
}//nextBox


function toggleRemoveButton(){
	if (($j('#locationSelectArea').children().length == 0) || ($j('#locationSelectArea').val() == null)) {
		$j('#removeButton').prop("disabled",true);					
	}else{
		$j('#removeButton').prop("disabled",false);					
	}	
}//disableRemoveButton

function toggleAddButton(){
	if($j('#inputUrlField').val().length > 0 ) {
		$j('#addIdButton').attr('disabled', false);
	} else {
		$j('#addIdButton').attr('disabled', true);
	}
}//toggleAddButton


function locationSelectAreaItemChange(){
	toggleRemoveButton();
}


function addAnotherUrl(){
	clearContainerStatus();
	$j('#addAnotherUrlDiv').hide();
	$j('#searchUrlDiv').show();
	$j('#listBoxDiv').show()
	$j('#locTextArea').hide();
	$j('#removeButton').hide();
	$j('#navigationButtons').hide();
	$j('#numberPlacesSearch').hide();
	$j('#addAnotherUrlBackButton').show();
	$j('#addAnotherUrlCancelButton').show();
	$j('#firstCancelButton').hide();
	
	toggleAddButton();
	resizeWidget();
}//addAnotherUrl


function divShowAddChildren(){
	$j('#childrenDiv').show();
	$j('#addAnotherUrlBackButton').hide();
	resizeWidget();
} //divShowAddChildren


function divShowlListBoxlocations(){
	$j('#childrenDiv').hide();
	$j('#searchUrlDiv').hide();
	$j('#addAnotherUrlDiv').show();
	$j('#listBoxDiv').show();
	$j('#locTextArea').show();
	$j('#removeButton').show();
	$j('#navigationButtons').show();
	$j('#numberPlacesSearch').show();
	$j('#addAnotherUrlBackButton').hide();
	
	resizeWidget();
}//divShowlListBoxlocations

function divCustomDesignBackButton(){
	
	if(tempIdValue.length > 0){
		removeIdFromBox(tempIdValue);
		tempIdValue = '';
	}	
	
	$j('#customDesignDiv').hide();
	$j('#searchUrlDiv').hide();
	$j('#addAnotherUrlDiv').show();
	$j('#listBoxDiv').show();
	$j('#locTextArea').show();
	$j('#removeButton').show();
	$j('#navigationButtons').show();
	$j('#numberPlacesSearch').show();
	$j('#addAnotherUrlBackButton').hide();
	$j('#addAnotherUrlCancelButton').hide();
	$j('#childrenDiv').hide();
	enableUrlInput()
	resizeWidget();
}//divCustomDesignBackButton


function showCustomDesignDiv() {
	$j('#childrenDiv').hide();
	$j('#searchUrlDiv').hide();
	$j('#listBoxDiv').hide();
	$j('#generatedCodeDiv').hide();
	$j('#customDesignDiv').show();
	resizeWidget();
}//showCustomDesignDiv


function cancelToListBox(){
	$j('#childrenDiv').hide();
	childrenArray = [];
	clearContainerStatus();
	enableUrlInput();

	if(tempIdValue.length > 0){
		removeIdFromBox(tempIdValue);
		tempIdValue = '';
	}			

	$j('#childrenDiv').hide();
	$j('#searchUrlDiv').show();
	$j('#addAnotherUrlDiv').hide();
	$j('#customDesignDiv').hide();
	$j('#listBoxDiv').hide();
	
	toggleAddButton();
	resizeWidget();
}//cancelToListBox

function cancelToStart(){
	if(removeAllFromBox() == true){
		$j('#searchUrlDiv').show();
		$j('#childrenDiv').hide();				
		$j('#customDesignDiv').hide();				
		$j('#childrenDiv').hide();				
		$j('#addAnotherUrlDiv').hide();
		$j('#listBoxDiv').hide();
		$j('#generatedCodeDiv').hide();

		childrenArray = [];
		enableUrlInput();
		clearContainerStatus();
		toggleAddButton();
		resizeWidget();
	}
}//cancelToStart

function enableUrlInput(){
	$j('#addIdButton').attr('disabled', false);
	$j('#inputUrlField').attr('readonly', false);
	$j('#inputUrlField').val('');
}//enableUrlInput


function clearContainerStatus(){
	$j('#getContainerStatus').text('');
	$j('#getContainerStatus').css({'border-style': 'none'});
}//clearContainerStatus


function selectAll(){
	$j('#generatedCodeBox').select();
}//selectAll	


function resizeWidget(){
	setTimeout(resizeMe,300);
}//resizeWidget

$j(document).ready(function() {
	var ua = window.navigator.userAgent;
	var msie = ua.indexOf('MSIE ');
	var IEVersion = parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)));
	if(IEVersion <= 8){	
		$j('#inputUrlField').css({ 'height': '16px'});
		$j('#boxStyle').html('<p>More customization options available in a modern browser such as Firefox, Chrome, Opera, or IE11.</p>');
		$j('#boxStyle').css({ 'color': 'red'});
		$j('#inputUrlField').attr('onpropertychange', 'toggleAddButton()');
	} else {
		$j('#inputUrlField').bind('input', function() { 
			toggleAddButton();
		});
	}
	
	instanceHostname = window.parent._jive_base_absolute_url.replace(/.*?:\/\//g, "");
});//document ready
