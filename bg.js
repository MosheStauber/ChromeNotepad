// This is run in the background when the popup HTML closes.
// Update the last date viewed website and save the notebook. 
function saveNotebook(notebook, url){
    notebook.lastVisited = Date.now();
    var jsonfile = {};
    jsonfile[url] = notebook;
    chrome.storage.sync.set(jsonfile, function (data) {
        if (chrome.extension.lastError) {
            console.log('An error occurred: ' + chrome.extension.lastError.message);
        }
    });
}
