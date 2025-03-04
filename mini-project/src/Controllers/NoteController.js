import { noteModel } from "../model/Notemodel";
import { noteView } from "../views/NoteView";  

export class NoteController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }

    async init() {
        const notes = await this.model.fetchNotes();
        notes.forEach(note => this.view.displayNote(note));
    }

    async addNote(title, content, isPinned) {
        const note = { title, content, isPinned };
        const savedNote = await noteModel.saveNote(note);
    
        if (savedNote && savedNote.id) {  
            this.view.displayNote(savedNote);
        } else {
            console.error("Failed to save note or missing ID", savedNote);
        }
    }         

    async updateNote(id, updatedData) {
        const success = await this.model.updateNote(id, updatedData);

        if (success) {
            console.log(`Note ${id} updated successfully.`);
        } else {
            console.error(`Failed to update note ${id}.`);
        }
    }

    async searchNotes(query) {
        const matchedNotes = await this.model.searchNotes(query);
        this.view.displayMatchedNotes(matchedNotes); 
    }

    async trashNote(id, noteElement) {
        const success = await this.model.trashNote(id);
        
        if (success) {
            noteElement.remove(); 
            console.log(`Note ${id} moved to trash.`);
        } else {
            console.error(`Failed to move note ${id} to trash.`);
        }
    }    
    
    updatePinStatus(note) {
        noteModel.updateNotePinStatus(note)
            .then(data => {
                console.log(`Note ${note.id} updated successfully:`, data);
            })
            .catch(error => {
                console.error(`Failed to update note ${note.id}:`, error);
            });
    }

    displayRestoredNoteInOthersSection(note) {
        if (!note.isPinned && !note.isTrashed) {
            this.view.displayNote(note); 
        }
    }

    async getNoteById(noteId){
        const note = this.model.getNoteById(noteId);
        if (note){
            return note;
        }
        else {
            console.log("No note came from model for this id");
        }
    }

    async updateNoteOrder(updatedOrder) {
        try {
            // Call the Model to update the order on the server
            await this.model.updateNoteOrderOnServer(updatedOrder);
            console.log('Note order updated in the model.');
        } catch (error) {
            console.error('Failed to update order:', error);
        }
    }

    updateNoteOrderInView(updatedNotes) {
        // Clear the pinned and others sections before re-rendering
        this.view.pinnedSection.innerHTML = '';
        this.view.othersSection.innerHTML = '';
    
        // Re-render each note in the correct section based on updated order
        updatedNotes.reverse().forEach(note => this.view.displayNote(note));
        console.log("updated new");
    }
    
    
       
}

export const noteController = new NoteController(noteModel, noteView);
