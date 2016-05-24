// var NoteBook = {
//     this.lastVisited: lastVisit,
//     this.notes: {
//           dateCreated: textValue
//      }
// }

var background; // Background script for saving notes after close
var myNotebook = {}; // The notebook with all the data
var currentNoteId = ""; // The currently open note
var notebookURL = ""; // The url to retrieve the correct notebook from storage

// Get the url for the ACTIVE TAB and use the callback provided
function getCurrentTabUrl(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    var tab = tabs[0];
    var url = String(tab.url);
    callback(url);
  });
}

// To add a note-button, find the correct note id, add a new entry to the notebook,
// create a listener, make it active and insert into note selection div
function createNewNote(noteId){

    var noteSelection = document.getElementById("note-selection");

    // Iterate over all the children of the note selection. If found a note
    // with the same id, set the note to a new id and start searching
    // from the beginning with the new note id to find a match.
    var children = noteSelection.children;
    var count = 0;
    var tempNoteId = noteId;
    for (var i = 0; i < children.length; i++){
        if (String(children.item(i).id) == tempNoteId){
            tempNoteId = noteId + "(" + ++count + ")";
            i = -1;
        }
    }
    // set the new note id
    noteId = tempNoteId;
    // If the NoteBook doesnt already contain the id, create a blank entry for
    // it in the notebook
    if(!myNotebook.notes.hasOwnProperty(noteId)){
        myNotebook.notes[noteId] = "";
    }

    // Create new note button in the note selection box with its noteId displayed
    var newNote = document.createElement("BUTTON");
    newNote.id = noteId;
    var t = document.createTextNode(noteId);
    newNote.appendChild(t);

    // Add an Event listener that when the user click on the note, save the
    // currently open note, replace the text area with the new notes content,
    // update the currentNoteId and highlight the new note button.
    newNote.addEventListener("click", function () {
        saveCurrentNote();
        currentNoteId = this.id;
        document.getElementById("my-text-area").value = myNotebook.notes[currentNoteId];
        var buttons = document.getElementsByClassName("btn-highlight");
        for (var i = 0; i < buttons.length; i++){
            buttons[i].className = "";
        }
        this.className = "btn-highlight";
    });

    // Insert the new note at the end of the list, before the newNote button
    var newNoteBtn = document.getElementById("new-note-btn");
    noteSelection.insertBefore(newNote, newNoteBtn);
    // Activate newly added note
    newNote.click();
}

// Update the text of the currently open note in the notebook.There can be a
// null note only after a deletion when the current note is unkown.
function saveCurrentNote(){
    if(currentNoteId){
        var noteText = document.getElementById("my-text-area").value;
        myNotebook.notes[currentNoteId] = noteText;
    }
}

// Deleting the currently selected note: Remove entry in the notebook and clear
// text area. Find the next note to select, if there is one, and simulate a click to activate.
// Remove the note from the list, clear the currentNoteId.
function deleteCurrentNote(){
    myNotebook.notes[currentNoteId] = null;
    delete myNotebook.notes[currentNoteId];
    document.getElementById("my-text-area").value = "";

    var noteSelection = document.getElementById("note-selection");
    var note = document.getElementById(currentNoteId);
    currentNoteId = null;

    if(note.previousElementSibling){
        note.previousElementSibling.click();
    } else if (note.nextElementSibling.id !== "new-note-btn"){
        note.nextElementSibling.click();
    }

    noteSelection.removeChild(note);
}

// Attempt to retrive notebook based on the url, if a NO notebook exists for the
// url, create an empty notebook and add a blank note with the current date as
// ID. If there is a notebook for the url, display the last date visited the site,
// populate all the notes from the notebook in the dropdown and select the first one.
function getAllNotesForSite(notebookURL){
    // chrome.storage.sync.clear(function(){console.log("cleared storage")});
    chrome.storage.sync.get(notebookURL, function (noteBook){
        if (Object.keys(noteBook).length === 0){ // No notebook found for site
            myNotebook = {
                lastVisited: "",
                notes: {}
            }
            var date = new Date();
            var noteId = "" + (date.getMonth()+1) +"/"+ (date.getDate());
            createNewNote(noteId);
            currentNoteId = noteId;
        }else { // Found a notebook
            myNotebook = noteBook[notebookURL];
            var date = new Date(myNotebook.lastVisited);
            document.getElementById("last-visited").innerHTML = date.toDateString();
            for (var key in myNotebook.notes){
                createNewNote(key);
            }
            document.getElementById("note-selection").children.item(0).click();
        }
    });
}

// When the dropdown is is loaded, set listeners for UI and get notes for the site
document.addEventListener('DOMContentLoaded', function() {
    // Set the background script to call later when popup closes
    background = chrome.extension.getBackgroundPage();

    document.getElementById("new-note-btn").addEventListener("click",function(){
        var date = new Date();
        var noteId = "" + (date.getMonth()+1) +"/"+ (date.getDate());
        createNewNote(noteId);
    });

    document.getElementById('delete-note').addEventListener("click", function(){
        deleteCurrentNote();
    });

    getCurrentTabUrl(function(url) {
        notebookURL = url;
        getAllNotesForSite(notebookURL);
    });
});

// When the popup closes, save the notebook in the background script
addEventListener('unload', function () {
    saveCurrentNote();
    background.saveNotebook(myNotebook, notebookURL);
});
