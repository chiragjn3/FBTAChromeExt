//Function to get and store keys in chrome storage
var local = (function(){

	//Get from storage
    var getData = function(key){
		chrome.storage.local.get(key, function (values) {
        console.log(key, values);
		});
    }
	
	var setData = function(key, data){
		//Add newData to existing data
		//var stringData = JSON.stringify(data);
		//console.log("String Data - " + stringData);
			
		var jsonData = {};
		jsonData[key] = data;
		chrome.storage.local.set(jsonData, function () {
		//console.log('Saved to storage', key, stringData);
		});	
	}

	//Store to storage
    var updateData = function(key, newData){		
		//Get already store data
		chrome.storage.local.get(key, function (values) {
			//console.log(key, values);	
			var oldData = "";
			if (values[key]){	
				for(k in values){
					oldData += values[k] + ",";			
				}
				//console.log("Old Data - " + oldData);
			}
			
			//Add newData to existing data
			var stringNewData = JSON.stringify(newData);
			var updatedData = oldData + stringNewData;
			//console.log("Updated Data - " + updatedData);
				
			var jsonData = {};
			jsonData[key] = updatedData;
			chrome.storage.local.set(jsonData, function () {
			//console.log('Saved to storage', key, updatedData);
			});			
		});
	}
    return {get:getData,set:setData,update:updateData}
})();


//*************************************************************************************
//********************Methods for the Single Element Picker Starts*********************
//*************************************************************************************

//Listening to Element click event
$(window).click(function(event) {
	console.log("Clicked Element - ", event);
	
	var key = "toggle";
	var toggleValue = false;
	chrome.storage.local.get(key, function (values) {
		if (values[key]){		
			//Converting data to array to parse
			var jsonData = "["+values[key]+"]";		
			var parsedData = JSON.parse(jsonData);
			
			toggleValue = parsedData[0].toggle;
			//console.log("Toggle Value from content script - " + toggleValue);		
			
			if(toggleValue)
			{
				var elementID = event.target.id;
				if(elementID != "")
				{
					//var className = event.target.className;
					//var description = getDescriptionFromID(elementID);
					getInfoClickedElement(event);	
					var elementInfo = {'label':elementLabel, 'type':elementType, 'id':elementID};
					local.update('elements',elementInfo);
				}
			}
		}
	});
});

//Get label and type of clicked element
var elementType = "";
var elementLabel = "";
function getInfoClickedElement(elementObj)
{
	elementType = "";
	elementLabel = "";
	
	try
	{		
		var elementID = elementObj.target.id;
		var className = elementObj.target.className;
		
		//Adding backslash as escape character for some special characters in ID 
		elementID = elementID.replace(/\./g, "\\.");
		elementID = elementID.replace(/\:/g, "\\:");
			
		//Get only first part of classname
		className = className.split(" ")[0];	
		console.log("Clicked element Classname - ", className);
			
		if(className === "sapMInputBaseInner" || className === "sapMText")
		{
			elementType = "input";
			if (elementObj.target.labels != null)
			{
				if(elementObj.target.labels.length > 0)
				{
					//elementLabel = nodes[0].id;	
					//var findTag = $("bdi");
					//var nodes =  $("#"+elementID+"").parents().eq(5).find(findTag);		
					//elementLabel = nodes[0].innerText;
					elementLabel = elementObj.target.labels[0].outerText;
				}
			}
			else
			{
				var ariaLabel = elementObj.target.getAttribute('aria-labelledby');
				console.log("Clicked element AriaLabel - ", ariaLabel);
				if(ariaLabel != null)
				{
					if(ariaLabel.indexOf(' ') >= 0)
					{
						ariaLabel = ariaLabel.split(" ")[1];	
					}
					elementLabel = document.getElementById(ariaLabel).innerText;
				}				
				
				var findTag = $("td");
				var nodes =  $("#"+elementID+"").parents().eq(5).find(findTag);	
				
				var xpath = getXPath(elementObj.target);
				console.log("Clicked element XPath - ", xpath);
			}					
		}
		else if(className === "sapMSFI")
		{
			elementLabel = elementObj.target.placeholder;
			elementType = "input";
		}
		else if(className === "sapMBtnDefault" || className === "sapMBtnEmphasized" || className === "sapMBtnHoverable" || className === "sapUshellShellHeadItmCntnt" || className === "sapMBtnInner")
		{
			elementType = "button";
			var findTag = $("bdi");
			var nodes =  $("#"+elementID+"").parent().find(findTag);
			if(nodes.length > 0)
			{
				elementLabel = nodes[0].innerText;
			}
			else
			{
				nodes =  $("#"+elementID+"").parent();
				elementLabel = nodes[0].title;
			}		
		}
		else if(className === "sapMBtnCustomIcon" || className === "sapMBtnContent")
		{
			elementType = "button";
			var findTag = $("bdi");
			var nodes =  $("#"+elementID+"").parents().eq(1).find(findTag);
			if(nodes.length > 0)
			{			
				elementLabel = nodes[0].innerText;
			}		
			else
			{
				nodes =   $("#"+elementID+"").parents().eq(1);
				elementLabel = nodes[0].title;
			}
		}
		else
		{
			elementLabel = elementObj.target.innerText;	
			elementType = elementObj.target.nodeName;
			if(elementID.includes("btn") || elementID.includes("button"))
			{
				elementType = "button";
			}			
		}
		console.log("Clicked element Label - ",elementLabel);
	}
	catch(err)
	{
		console.log("Error while getting element info is  - ",err.message);
	}
}

//Get Xpath of clicked element
function getXPath(element) 
{
	//console.log("getXPath element", element);
    if (element.tagName == 'HTML')
        return '/HTML[1]';
    if (element===document.body)
        return '/HTML[1]/BODY[1]';
	
	var ix = 0;
	var siblings= element.parentNode.childNodes;
	for (var i= 0; i<siblings.length; i++) 
	{
		var sibling = siblings[i];		
		if(element.tagName === "TABLE")			
			return '//*[@id="'+element.id+'"]';
		if (sibling === element)
			return getXPath(element.parentNode)+'/'+element.tagName+'['+(ix+1)+']';
		if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
			ix++;
	}
}


/*
//Get element descripton from element ID
function getDescriptionFromID(elementID)
{
	var result = elementID.split("::");
	
	//Get the splitted data after 2 item in array and join remaining items
	result = result.splice(2,).join(" ");
	
	//Remove the application name from string and remove all special characters
	var description = result.split("--")[1];
	description = description.replace(/[^A-Z0-9]+/ig, " ");
	
	//Remove some unwanted values from the description
	var deleteValues = ["content","CbBg","img","bdi","BDI","inner","Basic"];
	for (i = 0; i < deleteValues.length; i++)
	{
		description = description.replace(deleteValues[i]," ");
	}	
	console.log(description);
	return description;
}
*/
//*************************************************************************************
//********************Methods for the Single Element Picker Ends***********************
//*************************************************************************************



//*************************************************************************************
//********************Methods for the DOM Parsing Starts*******************************
//*************************************************************************************

//Function for requesting the DOM parsing
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        //console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension" + request.greeting);

        if (request.greeting == "download")
		{
			key = "dom";
			var body = document.getElementsByTagName("body");
			console.log("DOM Body in Nodes Format: ", body);
			
			var elem = document.getElementById("canvas");
			console.log("Parsing the Canvas ", elem);
			
			jsonDom = "";
			
			//getCompleteDomElements(document.body);
			getCompleteDomElements(elem);
			
			jsonDom = jsonDom.substring(1);
			
			//console.log("DOM json data - ", jsonDom);
			local.set(key,jsonDom);
		}	
		sendResponse({farewell: "downloadReady"});
});


var json = "";
var jsonTableRow = "";
var jsonTable = "";
//Get all the required elements available in DOM	
function getCompleteDomElements(element){
	var children = element.childNodes.length;
	//console.log("Child count", children);
	
    for(var i = 0; i < children; i++)
	{
        if(element.childNodes[i].nodeType != 3)
		{					
			if(element.childNodes[i].style.visibility === "")
			{
				if(!isTagTableElement(element))
				{
					if(element.childNodes[i].tagName === "INPUT")
					{	
						var label = "";
						var type = "";
						
						//console.log("Node ID" + element.childNodes[i].id);
						if (element.childNodes[i].labels != null)
						{
							var id = element.childNodes[i].id;
							if(document.getElementById(id).hasAttribute('type'))
							{
								type = element.childNodes[i].getAttribute('type'); 
								//console.log("Type", type);
							}
								
							if(element.childNodes[i].labels.length > 0)
							{
								label = element.childNodes[i].labels[0].outerText;
								var temp = {'action':'input','id':id,'label':label,'type':type};						
								var stringData = JSON.stringify(temp);
								jsonDom = jsonDom + "," + stringData;							
								//console.log("jsonDom", jsonDom);							
							}
							else if(type != "text")
							{
								if(element.childNodes[i].title != "")
								{
									label = element.childNodes[i].title;
								}
								else if(element.childNodes[i].placeholder != "")
								{
									label = element.childNodes[i].placeholder;
								}
								
								var temp = {'action':'input','id':id,'label':label,'type':type};						
								var stringData = JSON.stringify(temp);
								jsonDom = jsonDom + "," + stringData;							
								//console.log("jsonDom", jsonDom);							
							}							
						}
					}
					else if(element.childNodes[i].tagName === "BUTTON")
					{
						var id = element.childNodes[i].id;
						var type = "";
						var label = "";
						
						if(element.childNodes[i].innerText != "")
						{						
							label = element.childNodes[i].innerText;						
						}
						else
						{						
							label = element.childNodes[i].title;											
						}
						var temp = {'action':'button','id':id,'label':label,'type':type};						
						var stringData = JSON.stringify(temp);
						jsonDom = jsonDom + "," + stringData;
						//console.log("jsonDom", jsonDom);
					}
					else if(element.childNodes[i].tagName === "A")
					{
						var id = element.childNodes[i].id;
						var type = "link";
						var label = element.childNodes[i].title;
						
						var temp = {'action':'link','id':id,'label':label,'type':type};						
						var stringData = JSON.stringify(temp);
						jsonDom = jsonDom + "," + stringData;
					}
					else if(element.childNodes[i].tagName === "TABLE")
					{
						jsonTable = "";
						
						var trs = $(element).find("tbody>tr");
						//console.log("tr",  trs);
						
						getTableRows(trs);
						jsonTable = jsonTable.substring(1);
						//console.log("jsonTable", jsonTable);
						
						if(jsonTable != "")			
						jsonDom = jsonDom + ",{\"table\" : [" + jsonTable + "]}"; 
					}
				}
			}			
        }
		getCompleteDomElements(element.childNodes[i]);
    }	
}


//Function to check if element is part of Table Tag
function isTagTableElement(element) 
{
	if (element.tagName === 'HTML')
        return false;
	else if(element.tagName === "TABLE")			
		return true;
	else
		return isTagTableElement(element.parentNode);
}


//Function to parse all rows of table
function getTableRows(element)
{
	for(var i = 0; i < element.length; i++)
	{
		jsonTableRow = "";
		var sibling = element[i];
		getTableColumns(sibling.childNodes);
		
		jsonTableRow = jsonTableRow.substring(1);
		if(jsonTableRow != "")			
			jsonTable = jsonTable + ",{\"tr\" : [" + jsonTableRow + "]}"; 
	}
}


//Function to parse all columns of row
function getTableColumns(element)
{
	var id = "";
	var label = "";
	var action = "";
	var type = "";

    for(var i = 0; i < element.length; i++)
	{
		var sibling = element[i];
		
		if(sibling.tagName === "INPUT")
		{
			id = sibling.id;
			//console.log("input id", sibling.id);
			
			if(document.getElementById(sibling.id).hasAttribute('aria-labelledby'))
			{
				var ariaLabel = sibling.getAttribute('aria-labelledby'); 
				if(ariaLabel.indexOf(' ') >= 0)
				{
					ariaLabel = ariaLabel.split(" ")[1];	
				}
				label = document.getElementById(ariaLabel).innerText;
				//console.log("Label", label);
			}
			if(document.getElementById(sibling.id).hasAttribute('type'))
			{
				type = sibling.getAttribute('type'); 
				//console.log("Type", type);
			}
			
			var temp = {'action':'input','id':id,'label':label,'type':type};
			var stringData = JSON.stringify(temp);
			jsonTableRow = jsonTableRow + "," + stringData;				
		}		
		else if(sibling.tagName === "A")
		{
			var id = sibling.id;
			var type = "link";
			var label = sibling.innerText;
			
			var temp = {'action':'link','id':id,'label':label,'type':type};						
			var stringData = JSON.stringify(temp);
			jsonTableRow = jsonTableRow + "," + stringData;
		}		
		getTableColumns(sibling.childNodes);		
	}
}


//Recursively get the table elements xpath
/*
var columnNumber = 0;
function getTableXPath(element)
{
	var siblings = element.childNodes;
	var xpath = "";
	var label = "";
	var action = "";
	//console.log("siblings", siblings);
	//console.log("siblings length", siblings.length);
	//console.log("{");
	
    for(var i = 0; i < siblings.length; i++)
	{
		var sibling = siblings[i];
		//console.log("sibling", sibling);
		
		
		//console.log("sibling tagName", action);
		//console.log("Sibling Node type", sibling.nodeType);
		
		//console.log("sibling child node length", sibling.childNodes.length);
		
		
		//if(sibling.tagName === "TH")
		//{
		//	columnNumber = siblings.length;
		//	console.log("siblings length", columnNumber);
		//}	
			
		
		//If nodeType 3 it means 
		if(sibling.nodeType == 3)
		{
			//console.log("{");
			//console.log("insde of get xpath 3");
			xpath = getXPath(sibling.parentNode);
			label = sibling.nodeValue;
			action = sibling.parentNode.tagName;
			//console.log("node value ", label);
			//console.log("xapth of node type 3 ", xpath);
			var temp = {'action':action,'xpath':xpath,'label':label};
			console.log("array", temp);
			//console.log("}");
		}
		else if(sibling.childNodes.length == 0)
		{
			//console.log("{");
			//console.log("insde of get xpath 1");
			action = sibling.tagName;
			xpath = getXPath(sibling);
			//console.log("xapth of node type 1 ", xpath);
			var temp = {'action':action,'xpath':xpath,'label':label};
			console.log("array", temp);
			//console.log("}");
		}
		else
		{
			getTableXPath(element.childNodes[i]);
		}					
		}					
	}
	//console.log("}");
}
*/
//*************************************************************************************
//********************Methods for the DOM Parsing Ends*********************************
//*************************************************************************************



// Unique ID for the className.
var MOUSE_VISITED_CLASSNAME = 'crx_mouse_visited';

// Previous dom, that we want to track, so we can remove the previous styling.
var prevDOM = null;

// Mouse listener for any move event on the current document.
document.addEventListener('mousemove', function (e) {
	try {
		var key = "toggle";
		var toggleValue = false;
		chrome.storage.local.get(key, function (values) {
			if (values[key]){	
				//console.log(values[key]);
				
				//Converting data to array to parse
				var jsonData = "["+values[key]+"]";		
				var parsedData = JSON.parse(jsonData);			
				toggleValue = parsedData[0].toggle;		
			
				if(toggleValue)
				{
					var srcElement = e.srcElement;

					// Remove the class name as we will be styling the new one after.
					if (prevDOM != null) {
					  prevDOM.classList.remove(MOUSE_VISITED_CLASSNAME);
					}

					// Add a visited class name to the element. So we can style it.
					srcElement.classList.add(MOUSE_VISITED_CLASSNAME);

					// The current element is now the previous. So we can remove the class
					// during the next iteration.
					prevDOM = srcElement;
				}
				else
				{
					if (prevDOM != null) 
					{
					  prevDOM.classList.remove(MOUSE_VISITED_CLASSNAME);
					}
				}
			}		
		});	
	}
	catch(err) {
		console.log(err.message);
	}
}, false);