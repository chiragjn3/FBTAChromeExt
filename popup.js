//Add element to popup
function addElementsToPopup() {
	var key = "elements";
	chrome.storage.local.get(key, function (values) {
		if (values[key]){	
			//console.log(values[key]);
			
			//Converting data to array to parse
			var jsonData = "["+values[key]+"]";
			var parsedData = JSON.parse(jsonData);
			var counter = 1;
			
			//Append data to popup
			for(var k in parsedData) {			
				var tr = document.createElement('tr');
				tr.setAttribute("id","trRow_"+counter+"");
				
				var td1 = document.createElement('td');
				var td2 = document.createElement('td');
				var td3 = document.createElement('td');
				var td4 = document.createElement('td');
				var td5 = document.createElement('td');
				
				td1.setAttribute("class","tableTd");
				td2.setAttribute("class","tableTd");
				td3.setAttribute("class","tableTd");
				td4.setAttribute("class","tableTd");
				td5.setAttribute("class","tableTd");
				
				//Adding label to column 1
				var input1 = document.createElement("input");
				input1.setAttribute("class","tableInput1");
				input1.type = "text";
				input1.value = parsedData[k].label;
				
				//Adding type to column 2
				var input2 = document.createElement("input");
				input2.setAttribute("class","tableInput2");
				input2.type = "text";
				input2.value = parsedData[k].action;
				
				//Adding id to column 3
				var input3 = document.createElement("input");
				//input3.setAttribute("readonly","true");
				input3.setAttribute("class","tableInput3");
				input3.type = "text";
				input3.value = parsedData[k].id;
				
				//Adding delete button to column 4
				var deleteButton = document.createElement('div');
				deleteButton.setAttribute("class","deleteSingle");
				deleteButton.setAttribute("id","deleteSingle_"+counter+"");
				//deleteButton.setAttribute("type","button");
				deleteButton.setAttribute("title","Delete");

				var deleteIcon = document.createElement('i');
				deleteIcon.setAttribute("class","fa fa-trash-o");
				deleteIcon.setAttribute("aria-hidden","true");
				deleteIcon.setAttribute("id","deleteSingle_"+counter+"");
				deleteButton.appendChild(deleteIcon);			
				
				td1.innerHTML = counter;
				td2.appendChild(input1);
				td3.appendChild(input2);
				td4.appendChild(input3);
				td5.appendChild(deleteButton);
					
				tr.appendChild(td1);
				tr.appendChild(td2);	
				tr.appendChild(td3);
				tr.appendChild(td4);
				tr.appendChild(td5);
					
				document.getElementById('paths').appendChild(tr.cloneNode(true));
				counter += 1;
			}
		}	
		else
		{
			//No element available
		}
	});
}

//Function to delete single element
$(window).click(function(event) {
	//console.log("Click event: ", event);
	var id = event.target.id;
	if(id.startsWith("deleteSingle_"))
	{
		deleteElementFromPopup(id);		
	}
});


//Delete all elements from popup
function deleteElementsFromPopup() { 
	var e = document.getElementById('paths'); 
	
	//e.firstElementChild can be used. 
	var child = e.lastElementChild;  
	while (child) { 
		//console.log("Removing all elements child - ", child);
		e.removeChild(child); 
		child = e.lastElementChild; 
	}	
} 

//Delete all elements from storage
function deleteElementsFromStorage()
{
	chrome.storage.local.remove("elements",function(){
		var error = chrome.runtime.lastError;
		if (error) {
			console.error(error);
		}
	});	
}


//Delete element from popup
function deleteElementFromPopup(id) { 
	var idNumber = id.replace(/\D/g, "");
	console.log("Delete ID - ", idNumber);
	document.getElementById("trRow_"+idNumber+"").remove(); 

	var key = "elements";
	chrome.storage.local.get(key, function (values) {
		if (values[key]){	
			//console.log(values[key]);
			
			//Converting data to array to parse
			var jsonData = "["+values[key]+"]";
			var parsedData = JSON.parse(jsonData);
			
			for(var k in parsedData) {
				if(k == idNumber-1) {
					parsedData.splice(k, 1);
					break;
				}
			}
			
			//Converting data back to string
			var stringNewData = JSON.stringify(parsedData);
			stringNewData = stringNewData.substring(1, stringNewData.length-1);
			//console.log(stringNewData);
			
			var jsonData = {};
			jsonData[key] = stringNewData;	
			deleteElementsFromPopup();
			chrome.storage.local.set(jsonData, function () {
				addElementsToPopup();
				//console.log('Saved to storage', key, stringNewData);
			});			
		}
	});	
}

	
//On click event of Send Data button
window.onload = function(){
	document.getElementById("sendElements").onclick = function() {				
		var key = "elements";
		chrome.storage.local.get(key, function (values) {
			if (values[key]){	
				//console.log(values[key]);
				
				//Converting data to array to parse
				var jsonData = "["+values[key]+"]";	
				var parsedData = JSON.parse(jsonData);			
				
				//indentation in json format, human readable
				var _myArray = JSON.stringify(parsedData , null, 4); 
				var vLink = document.createElement('a'),
				vBlob = new Blob([_myArray], {type: "octet/stream"}),
				vName = 'Element_Export.json',
				vUrl = window.URL.createObjectURL(vBlob);
				vLink.setAttribute('href', vUrl);
				vLink.setAttribute('download', vName );
				vLink.click();			
			}	
		});
	}
	
	
	document.getElementById("sendDom").onclick = function() {		
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {greeting: "download"}, function(response) {
				if(response.farewell === "downloadReady" )
				{
					var key = "dom";
					chrome.storage.local.get(key, function (values) {
						if (values[key])
						{	
							//console.log("DOM",values[key]);
							
							//Converting data to array to parse
							var jsonData = "{\"items\":["+values[key]+"]}";	
							var parsedData = JSON.parse(jsonData);			
							
							//indentation in json format, human readable
							var _myArray = JSON.stringify(parsedData , null, 4); 
							var vLink = document.createElement('a'),
							vBlob = new Blob([_myArray], {type: "octet/stream"}),
							vName = 'Element_Export.json',
							vUrl = window.URL.createObjectURL(vBlob);
							vLink.setAttribute('href', vUrl);
							vLink.setAttribute('download', vName );
							vLink.click();			
						}

						//Removing the DOM key from storage
						chrome.storage.local.remove(key,function(){
							var error = chrome.runtime.lastError;
							if (error) {
								console.error(error);
							}
						});
					});					
				}
			});
		});
	}
};


//
document.getElementById('hideDiv').onclick=function(event)
{
	close();
};


//
document.getElementById('deleteDiv').onclick=function(event){
	if(confirm("Do you really want to delete all elements?")==!1)
	{
		return
	}
	deleteElementsFromPopup();
	deleteElementsFromStorage();
};


//Extension page load event
window.addEventListener('DOMContentLoaded', function () {
	var key = "toggle";
	var toggleValue = false;
	document.getElementById("sendElements").style.display="none";
	chrome.storage.local.get(key, function (values) {
		if (values[key]){	
			//console.log(values[key]);
			
			//Converting data to array to parse
			var jsonData = "["+values[key]+"]";		
			var parsedData = JSON.parse(jsonData);			
			toggleValue = parsedData[0].toggle;
			//console.log("Toggle Value from popup script - " + toggleValue);	

			//set the toggle value
			document.getElementById("turnOnOffCheckbox").checked = toggleValue;		
			
			//If true add the element to the popup
			if(toggleValue)
			{
				addElementsToPopup();
				document.getElementById("sendElements").style.display = "block";
			}
		}			
	});
	
	var toggleElement = document.getElementById('turnOnOffCheckbox');
	toggleElement.addEventListener('click', function() {
		toggleValue = document.getElementById("turnOnOffCheckbox").checked;
		//console.log("Toggle Value from popup script - " + toggleValue);
	  
		if(!toggleValue){
			document.getElementById("sendElements").style.display="none";
			deleteElementsFromPopup();
			deleteElementsFromStorage();			
		}
		else
		{
			document.getElementById("sendElements").style.display="block";
		}
		
		var jsonData = {};
		var toggleData = "{\"toggle\":"+toggleValue+"}";
		jsonData[key] = toggleData;
		
		chrome.storage.local.set(jsonData, function () {
			//console.log('Saved to storage', key, toggleData);
		});				
    });
});
