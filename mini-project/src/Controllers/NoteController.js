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

    async updateNoteOnServer(id, updatedData) {
        return await noteModel.updateNote(id, updatedData); 
    }

    async addNoteToServer(note) {
        return await noteModel.saveNote(note); 
    }

    async syncNotesToServer(notes) {
        return this.model.syncNotesToServer(notes);
    }

    async addNote(title, content, isPinned) {
        const note = { title, content, isPinned };
    
        if (navigator.onLine) {
            const savedNote = await this.model.saveNote(note);
            if (savedNote && savedNote.id) {
                this.view.displayNote(savedNote);
            } else {
                console.error("Failed to save note or missing ID", savedNote);
            }
        } else {
            console.log("hello")
            const tempId = this.model.generateTemporaryId();
            this.view.displayNote({ id: tempId, ...note });
            this.model.saveOfflineChange(tempId, note); 
        }
    }           

    async updateNote(id, updatedFields) {
        if (navigator.onLine) {
            const updatedNote = await this.model.updateNote(id, updatedFields); 
    
            if (updatedNote && updatedNote.id) {
                this.view.updateNoteInUI(updatedNote); 
            } else {
                console.error(`Failed to update note ${id} on the server.`);
            }            
        } else {
            this.model.saveOfflineChange(id, updatedFields);
            this.view.updateNoteInUI({ id, ...updatedFields });
        }
    }    
    
    async searchNotes(query) {
        const matchedNotes = await this.model.searchNotes(query);
        this.view.displayMatchedNotes(matchedNotes); 
    }

    async trashNote(id, noteElement) {
        if (navigator.onLine) {
            const success = await this.model.trashNote(id);
            if (success) {
                noteElement.remove();
                console.log(`Note ${id} moved to trash.`);
            } else {
                console.error(`Failed to move note ${id} to trash.`);
            }
        } else {
            this.storeOfflineChange(id, { isTrashed: true });
            noteElement.remove();
        }
    }
    
    storeOfflineChange(id, changeData) {
        const offlineChanges = JSON.parse(localStorage.getItem(id)) || {};
        const updatedChanges = { ...offlineChanges, ...changeData };
        localStorage.setItem(id, JSON.stringify(updatedChanges));
        console.log(`Stored offline change for note ${id}:`, updatedChanges);
    }

    getOfflineNotes() {
        const offlineNotes = [];
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                const noteData = JSON.parse(localStorage.getItem(key));
                offlineNotes.push({ id: key, ...noteData });
            }
        }
        return offlineNotes;
    }

    // async syncOfflineChanges() {
    //     const offlineNotes = this.getOfflineNotes(); 
    
    //     for (const noteData of offlineNotes) {
    //         if (noteData.id < 0) { 
    //             try {
    //                 const savedNote = await this.addNoteToServer(noteData);
    //                 const newId = savedNote.id;
    //                 this.view.updateNoteId(noteData.id, newId); 
    //                 localStorage.removeItem(noteData.id); 
    //             } catch (error) {
    //                 console.error(`Failed to sync offline note ${noteData.id}`, error);
    //             }
    //         } else {
    //             try {
    //                 await this.updateNoteOnServer(noteData.id, noteData);
    //                 localStorage.removeItem(noteData.id); 
    //             } catch (error) {
    //                 console.error(`Failed to sync offline changes for note ${noteData.id}`, error);
    //             }
    //         }
    //     }
    // }       

    // generateTemporaryId() {
    //     const keys = Object.keys(localStorage);
    //     const lastNegativeId = Math.min(0, ...keys.map(Number));
    //     return (lastNegativeId - 1).toString();  
    // }
    
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
        const note = await this.model.getNoteById(noteId);
        return note || console.log("No note found for this ID");
    }

    async updateNoteOrder(updatedOrder) {
        try {
            await this.model.updateNoteOrderOnServer(updatedOrder);
            console.log('Note order updated in the model.');
        } catch (error) {
            console.error('Failed to update order:', error);
        }
    }

    updateNoteOrderInView(updatedNotes) {
        this.view.pinnedSection.innerHTML = '';
        this.view.othersSection.innerHTML = '';
    
        updatedNotes.reverse().forEach(note => this.view.displayNote(note));
        console.log("updated new");
    }

    updateLocalStorageId(oldId, newId) {
        const noteData = JSON.parse(localStorage.getItem(oldId));
        if (noteData) {
            localStorage.setItem(newId, JSON.stringify(noteData));
            localStorage.removeItem(oldId);
        }
    }
}

export const noteController = new NoteController(noteModel, noteView);