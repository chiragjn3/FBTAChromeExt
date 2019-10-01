//Function to get and store keys in chrome storage
var local = (function()
{

    //Get from storage
    var getData = function(key)
    {
        chrome.storage.local.get(key, function(values)
        {
            //console.log(key, values);
        });
    }

    var setData = function(key, data)
    {
        //Add newData to existing data
        //var stringData = JSON.stringify(data);
        //console.log("String Data - " + stringData);

        var jsonData = {};
        jsonData[key] = data;
        chrome.storage.local.set(jsonData, function()
        {
            //console.log('Saved to storage', key, stringData);
        });
    }

    //Store to storage
    var updateData = function(key, newData)
    {
        //Get already store data
        chrome.storage.local.get(key, function(values)
        {
            //console.log(key, values);	
            var oldData = "";
            if (values[key])
            {
                for (k in values)
                {
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
            chrome.storage.local.set(jsonData, function()
            {
                //console.log('Saved to storage', key, updatedData);
            });
        });
    }
    return {
        get: getData,
        set: setData,
        update: updateData
    }
})();


//*************************************************************************************
//********************Methods for the Single Element Picker ***************************
//*************************************************************************************

//Listening to Element click event
$(window).click(function(event)
{
    console.log("Clicked Element - ", event);

    var key = "toggle";
    var toggleValue = false;
    chrome.storage.local.get(key, function(values)
    {
        if (values[key])
        {
            //Converting data to array to parse
            var jsonData = "[" + values[key] + "]";
            var parsedData = JSON.parse(jsonData);

            toggleValue = parsedData[0].toggle;
            //console.log("Toggle Value from content script - " + toggleValue);		

            if (toggleValue)
            {
				var elementInfo = getInfoClickedElement(event);              
				local.update('elements', elementInfo);
            }
        }
    });
});

//Get label and type of clicked element
function getInfoClickedElement(elementObj)
{
    var elementAction = "";
	var elementID = "";
	var elementLabel = "";
	var elementType = "";

    try
    {	
		//Find more relevant element either parent or child
		var updatedElement = findElement(elementObj.target);
		//console.log("updatedElement - ", updatedElement);
		
		if(updatedElement != null && updatedElement.id != "")
		{
			elementID = updatedElement.id;
			elementType = getTypeFromElement(updatedElement);

			if (updatedElement.tagName === "INPUT")
			{
				elementAction = "input";		
				elementLabel = getLabelFromElement(updatedElement);
			}
			else if(updatedElement.tagName === "BUTTON")
			{
				elementAction = "button";
				if (updatedElement.innerText != "")
				{
					elementLabel = updatedElement.innerText;
				}
				else
				{
					elementLabel = updatedElement.title;
				}
			}
			if (updatedElement.tagName === "A")
			{
				elementAction = "link";		
				elementLabel = updatedElement.title;
			}
			
			//If element type is radio or checkbox then change action to type
			if(elementType === "radio" || elementType === "CheckBox")
			{
				elementAction = elementType;
				elementType = "";
			} 	
			if(isTagTableElement(updatedElement))
			{
				elementType = "table";
			}
		}
		else
        {
			elementID = elementObj.target.id;
			
			var updatedSpanElement = findSpanElement(elementObj.target.childNodes);
			//console.log("updated SPAN Element - ", updatedSpanElement);
			
			if(updatedSpanElement != null && updatedSpanElement.id != "")
			{
				elementID = updatedSpanElement.id;
				elementLabel = updatedSpanElement.innerText;
				elementAction = updatedSpanElement.tagName;
				elementType = getTypeFromElement(updatedSpanElement);
			}
			else if(elementID != "")
			{
				elementLabel = elementObj.target.innerText;
				elementAction = elementObj.target.tagName;
				elementType = getTypeFromElement(elementObj.target);
			}

			if(isTagTableElement(elementObj.target))
			{
				elementType = "table";
			} 
        }
		
		var elementInfo = {
                        'action': elementAction,
                        'id': elementID,
						'label': elementLabel,
                        'type': elementType
        };
		return elementInfo;
    }
    catch (err)
    {
        console.log("Error while getting element info is  - ", err.message);
    }
}


//*************************************************************************************
//********************Methods for the DOM Parsing *************************************
//*************************************************************************************

//Function for requesting the DOM parsing
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse)
    {
        //console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension" + request.greeting);

        if (request.greeting == "download")
        {
            key = "dom";
            var body = document.getElementsByTagName("body");
            console.log("DOM Body in Nodes Format: ", body);

            var elem = document.getElementById("canvas");
            console.log("Parsing the Canvas ", elem);

            jsonDom = "";

            //getAllDomElements(document.body);
            getAllDomElements(elem);

            jsonDom = jsonDom.substring(1);

            //console.log("DOM json data - ", jsonDom);
            local.set(key, jsonDom);
        }
        sendResponse(
        {
            farewell: "downloadReady"
        });
    });


//Get all the required elements available in DOM
var jsonDom = "";
var jsonTable = "";
var jsonTableRow = "";
function getAllDomElements(element)
{
	try
    {
		var children = element.childNodes.length;
		//console.log("Child count", children);

		for (var i = 0; i < children; i++)
		{
			var sibling = element.childNodes[i];
			if (sibling.nodeType != 3 && sibling.style.visibility === "")
			{
				if (!isTagTableElement(element))
				{
					if (sibling.tagName === "INPUT")
					{
						var id = "";
						var label = "";
						var type = "";
						var action = "input";
						
						//console.log("Node ID" + sibling.id);
						if (sibling.labels != null)
						{
							id = sibling.id;
							label = getLabelFromElement(sibling);
							type = getTypeFromElement(sibling);	
							
							if(type === "radio" || type === "CheckBox")
							{
								action = type;
								type = "";
							}  
							
							//If label is empty then do not add input, but if it is checkbox or radio then add it.
							if(label != "" || action === "radio" || action === "CheckBox")
							{
								var temp = {
										'action': action,
										'id': id,
										'label': label,
										'type': type
									};
								var stringData = JSON.stringify(temp);
								jsonDom = jsonDom + "," + stringData;
								//console.log("jsonDom", jsonDom);	
							}
						}
					}
					else if (sibling.tagName === "BUTTON")
					{
						var id = sibling.id;
						var type = "";
						var label = "";

						if (sibling.innerText != "")
						{
							label = sibling.innerText;
						}
						else
						{
							label = sibling.title;
						}
						
						//If label is empty then do not get button
						if(label != "")
						{
							var temp = {
								'action': 'button',
								'id': id,
								'label': label,
								'type': type
							};
							var stringData = JSON.stringify(temp);
							jsonDom = jsonDom + "," + stringData;
							//console.log("jsonDom", jsonDom);
						}
					}
					else if (sibling.tagName === "A")
					{
						var id = sibling.id;
						var type = "link";
						var label = sibling.title;

						var temp = {
							'action': 'link',
							'id': id,
							'label': label,
							'type': type
						};
						var stringData = JSON.stringify(temp);
						jsonDom = jsonDom + "," + stringData;
					}
					else if (sibling.tagName === "TABLE")
					{
						var label = getLabelFromAriaLabel(sibling);
						
						var tableRows = $(element).find("tbody>tr");
						//console.log("tr",  tableRows);
						jsonTable = "";
						getTableRows(tableRows);
						jsonTable = jsonTable.substring(1);
						//console.log("jsonTable", jsonTable);

						if (jsonTable != "")
							jsonDom = jsonDom + ",{\"action\":\"Table\",\"label\":\"" + label + "\", \"nodes\" : [" + jsonTable + "]}";
					}
				}
			}
			getAllDomElements(sibling);
		}
	}
    catch (err)
    {
        console.log("Error while getting all dom elements is  - ", err.message);
    }
}


//Function to parse all rows of table
function getTableRows(element)
{
	try
	{
		var rowCount = 1;
		for (var i = 0; i < element.length; i++)
		{
			jsonTableRow = "";
			var sibling = element[i];
			getTableColumns(sibling.childNodes);

			jsonTableRow = jsonTableRow.substring(1);
			if (jsonTableRow != "")
				jsonTable = jsonTable + ",{\"action\":\"Row\",\"label\":\"" + rowCount + "\", \"nodes\" : [" + jsonTableRow + "]}";
			
			rowCount++;
		}
	}
    catch (err)
    {
        console.log("Function getTableRows error - ", err.message);
    }
}


//Recursively get all columns of row
function getTableColumns(element)
{
	try
	{
		var id = "";
		var label = "";
		var action = "";
		var type = "";

		for (var i = 0; i < element.length; i++)
		{
			var sibling = element[i];

			if (sibling.tagName === "INPUT")
			{
				id = sibling.id;
				label = getLabelFromAriaLabel(sibling);
				action = "input";
				type = getTypeFromElement(sibling);
				
				if(type === "radio" || type === "CheckBox")
				{
					action = type;	
				}
				type = "table";
				
				var temp = {
					'action': action,
					'id': id,
					'label': label,
					'type': type
				};
				var stringData = JSON.stringify(temp);
				jsonTableRow = jsonTableRow + "," + stringData;
			}
			else if (sibling.tagName === "A")
			{
				var id = sibling.id;
				type = "table";
				var label = sibling.innerText;

				var temp = {
					'action': 'link',
					'id': id,
					'label': label,
					'type': type
				};
				var stringData = JSON.stringify(temp);
				jsonTableRow = jsonTableRow + "," + stringData;
			}
			getTableColumns(sibling.childNodes);
		}
	}
    catch (err)
    {
        console.log("Function getTableColumns error - ", err.message);
    }
}

//*************************************************************************************
//********************Helper Methods***************************************************
//*************************************************************************************


//Function to check if element is part of Table Tag
function isTagTableElement(element)
{
    if (element.tagName === 'HTML')
        return false;
    else if (element.tagName === "TABLE")
        return true;
    else
        return isTagTableElement(element.parentNode);
}

//function to find child or parent relevant element
function findElement(element)
{
	var tag = "";
	if(element.childNodes.length > 0)
	{
		tag = findChildElement(element.childNodes);
	}
	if(tag === null || tag === "")
	{
		tag = findParentElement(element);
	}
	return tag;
}

//function to find parent relevant element
function findParentElement(element)
{
	//console.log("parent - ",element.tagName);
    if (element.tagName === 'HTML')
        return null;
	else if (element.tagName === "INPUT")
        return element;
    else if (element.tagName === "BUTTON")
        return element;
	else if (element.tagName === "A")
        return element;
    else
        return findParentElement(element.parentNode);
}

//function to find child relevant element
function findChildElement(element)
{
	for (var i = 0; i < element.length; i++)
	{
		var sibling = element[i];
		if (sibling.nodeType != 3)
		{
			//console.log("child - ",sibling.tagName);
			if (sibling.tagName === "INPUT")
				return sibling;
			else
				return findChildElement(sibling.childNodes);
		}
		else
		{
			return null;
		}
	}
	return null;
}

//Function to find SPAN in clicked element
function findSpanElement(element)
{
	//console.log("Span Element", element);
	for (var i = 0; i < element.length; i++)
	{
		var sibling = element[i];
		if (sibling.nodeType != 3)
		{
			//console.log("child span - ",sibling.tagName);
			if (sibling.tagName === "SPAN")
				return sibling;
			else
				return findSpanElement(sibling.childNodes);
		}
		else
		{
			return null;
		}
	}
	return null;
}

//Function to get type from element
function getTypeFromElement(element)
{
	var type = "";
	if (document.getElementById(element.id).hasAttribute('type'))
	{
		type = element.getAttribute('type');
		console.log("Element Type - ", type);
	}
	return type;
}


//Function to get Label from element
function getLabelFromElement(element)
{
	var label = "";
	//Find the label of clicked element
	if (element.labels != null && element.labels.length > 0)
	{
		label = element.labels[0].outerText;
	}
	else
	{
		label = getLabelFromAriaLabel(element);  
	}
	
	//If not able to find label by above methods
	if(label === "")
	{
		if (element.title != "")
		{
			label = element.title;
		}
		else if (element.placeholder != "")
		{
			label = element.placeholder;
		}
	}
	return label;
}

//Function to get label from aria-labelledby
function getLabelFromAriaLabel(element)
{
	var label = ""; 
	if (document.getElementById(element.id).hasAttribute('aria-labelledby'))
	{
		var ariaLabel = element.getAttribute('aria-labelledby');
		
		if (ariaLabel.indexOf(' ') >= 0)
		{
			ariaLabel = ariaLabel.split(" ");
			for (i = 0; i < ariaLabel.length; i++) 
			{
				if(document.getElementById(ariaLabel[i]) != null)
				{
					label = document.getElementById(ariaLabel[i]).innerText;
					if(label != "")
					{
						label = label.split("\n")[0];
						break;
					}
				}
			}				
		}
		else
		{
			label = document.getElementById(ariaLabel).innerText;
		}
		//console.log("Label from aria labe is - ", label);
	}
	return label;
}

/*
//Get Xpath of clicked element
function getXPath(element)
{
    //console.log("getXPath element", element);
    if (element.tagName == 'HTML')
        return '/HTML[1]';
    if (element === document.body)
        return '/HTML[1]/BODY[1]';

    var ix = 0;
    var siblings = element.parentNode.childNodes;
    for (var i = 0; i < siblings.length; i++)
    {
        var sibling = siblings[i];
        if (element.tagName === "TABLE")
            return '//*[@id="' + element.id + '"]';
        if (sibling === element)
            return getXPath(element.parentNode) + '/' + element.tagName + '[' + (ix + 1) + ']';
        if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
            ix++;
    }
}

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


//Recursively get the table elements xpath
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


// Unique ID for the className.
var MOUSE_VISITED_CLASSNAME = 'crx_mouse_visited';

// Previous dom, that we want to track, so we can remove the previous styling.
var prevDOM = null;

// Mouse listener for any move event on the current document.
document.addEventListener('mousemove', function(e)
{
    try
    {
        var key = "toggle";
        var toggleValue = false;
        chrome.storage.local.get(key, function(values)
        {
            if (values[key])
            {
                //console.log(values[key]);

                //Converting data to array to parse
                var jsonData = "[" + values[key] + "]";
                var parsedData = JSON.parse(jsonData);
                toggleValue = parsedData[0].toggle;

                if (toggleValue)
                {
                    var srcElement = e.srcElement;

                    // Remove the class name as we will be styling the new one after.
                    if (prevDOM != null)
                    {
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
    catch (err)
    {
        console.log(err.message);
    }
}, false);