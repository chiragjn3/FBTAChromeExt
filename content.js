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
//********************Methods for the Single Element Picker Starts*********************
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
                if (event.target.id != "")
                {
                    //var className = event.target.className;
                    //var description = getDescriptionFromID(elementID);
                    var elementInfo = getInfoClickedElement(event);              
                    local.update('elements', elementInfo);
                }
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
        elementID = elementObj.target.id;
		elementType = getTypeFromElementID(elementObj.target);
		
		if(isTagTableElement(elementObj.target))
		{
			elementType = "table";
			
			//If clicked element is part of table then find xpath
			//var elementXPath = getXPath(elementObj.target);
			//console.log("Clicked element XPath - ", elementXPath);
		}
	
        //Adding backslash as escape character for some special characters in ID 
        var tempElementID = elementID.replace(/\./g, "\\.");
        tempElementID = tempElementID.replace(/\:/g, "\\:");

        //Get only first part of classname
		var className = elementObj.target.className;
        className = className.split(" ")[0];
        console.log("Clicked element Classname - ", className);

        if (elementObj.target.tagName === "INPUT")
        {
            elementAction = "input";
			elementLabel = getLabelFromElement(elementObj.target);
        }

        else if (className === "sapMBtnDefault" || className === "sapMBtnEmphasized" || className === "sapMBtnHoverable" || className === "sapUshellShellHeadItmCntnt" || className === "sapMBtnInner")
        {
            elementAction = "button";
            var findTag = $("bdi");
            var nodes = $("#" + tempElementID + "").parent().find(findTag);
            if (nodes.length > 0)
            {
                elementLabel = nodes[0].innerText;
            }
            else
            {
                nodes = $("#" + tempElementID + "").parent();
                elementLabel = nodes[0].title;
            }
        }
        else if (className === "sapMBtnCustomIcon" || className === "sapMBtnContent")
        {
            elementAction = "button";
            var findTag = $("bdi");
            var nodes = $("#" + tempElementID + "").parents().eq(1).find(findTag);
            if (nodes.length > 0)
            {
                elementLabel = nodes[0].innerText;
            }
            else
            {
                nodes = $("#" + tempElementID + "").parents().eq(1);
                elementLabel = nodes[0].title;
            }
        }
        else
        {
            elementLabel = elementObj.target.innerText;
            elementAction = elementObj.target.nodeName;

            if (tempElementID.includes("btn") || tempElementID.includes("button"))
            {
                elementAction = "button";
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
var json = "";
var jsonTableRow = "";
var jsonTable = "";

function getAllDomElements(element)
{
    var children = element.childNodes.length;
    //console.log("Child count", children);

    for (var i = 0; i < children; i++)
    {
        if (element.childNodes[i].nodeType != 3)
        {
            if (element.childNodes[i].style.visibility === "")
            {
                if (!isTagTableElement(element))
                {
                    if (element.childNodes[i].tagName === "INPUT")
                    {
						var id = "";
                        var label = "";
                        var type = "";
						var action = "input";
						
                        //console.log("Node ID" + element.childNodes[i].id);
                        if (element.childNodes[i].labels != null)
                        {
                            id = element.childNodes[i].id;
							label = getLabelFromElement(element.childNodes[i]);
							type = getTypeFromElementID(element.childNodes[i]);	
							
							if(type === "radio" || type === "CheckBox")
							{
								action = type;
								type = "";
							}  
							
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
                    else if (element.childNodes[i].tagName === "BUTTON")
                    {
                        var id = element.childNodes[i].id;
                        var type = "";
                        var label = "";

                        if (element.childNodes[i].innerText != "")
                        {
                            label = element.childNodes[i].innerText;
                        }
                        else
                        {
                            label = element.childNodes[i].title;
                        }
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
                    else if (element.childNodes[i].tagName === "A")
                    {
                        var id = element.childNodes[i].id;
                        var type = "link";
                        var label = element.childNodes[i].title;

                        var temp = {
                            'action': 'link',
                            'id': id,
                            'label': label,
                            'type': type
                        };
                        var stringData = JSON.stringify(temp);
                        jsonDom = jsonDom + "," + stringData;
                    }
                    else if (element.childNodes[i].tagName === "TABLE")
                    {
                        jsonTable = "";

                        var tableRows = $(element).find("tbody>tr");
						//console.log("tr",  tableRows);
						
						var label = getLabelFromAriaLabel(element.childNodes[i]);
                        
                        getTableRows(tableRows);
                        jsonTable = jsonTable.substring(1);
                        //console.log("jsonTable", jsonTable);

                        if (jsonTable != "")
                            jsonDom = jsonDom + ",{\"action\":\"Table\",\"label\":\"" + label + "\", \"nodes\" : [" + jsonTable + "]}";
                    }
                }
            }
        }
        getAllDomElements(element.childNodes[i]);
    }
}


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


//Function to parse all rows of table
function getTableRows(element)
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

//Recursively get all columns of row
function getTableColumns(element)
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
            type = getTypeFromElementID(sibling);
			
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
            var type = "link";
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


//
function getTypeFromElementID(element)
{
	var type = "";
	if (document.getElementById(element.id).hasAttribute('type'))
	{
		type = element.getAttribute('type');
		//console.log("Element Type - ", type);
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