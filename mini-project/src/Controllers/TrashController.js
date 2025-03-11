import { noteModel } from "../model/Notemodel.js";
import { trashView } from "../views/TrashView.js";
import { noteController } from "../Controllers/NoteController.js";

export class TrashController {
    constructor() {
        this.model = noteModel;
        this.view = trashView;
    }

    async fetchTrashNotes() {
        try {
            const trashedNotes = await this.model.getTrashedNotes();
            console.log('Fetched trashed notes:', trashedNotes); // Debugging log
            this.view.displayTrashedNotes(trashedNotes);
        } catch (error) {
            console.error("Error in controller while fetching trashed notes:", error);
        }
    }          

    async restoreNote(id, trashElement) {
        try {
            // Set both isTrashed to false and isPinned to false to ensure proper restoration behavior
            const success = await this.model.updateNote(id, { isTrashed: false, isPinned: false });
            if (success) {
                // Remove the note element from the trash UI
                trashElement.remove(); 
                console.log(`Note ${id} restored.`);

                // Fetch the updated note and display it in the "Others" section
                const restoredNote = await this.model.getNoteById(id);
                
                // Use the NoteController to display the restored note in the "Others" section
                noteController.displayRestoredNoteInOthersSection(restoredNote);
            } else {
                console.error(`Failed to restore note ${id}.`);
            }
        } catch (error) {
            console.error(`Error restoring note ${id}:`, error);
        }
    }

    async permanentlyDeleteNote(id, trashElement) {
        try {
            const success = await this.model.deleteNote(id);
            if (success) {
                // Remove the note element from the trash UI
                trashElement.remove(); 
                console.log(`Note ${id} permanently deleted.`);
            } else {
                console.error(`Failed to permanently delete note ${id}.`);
            }
        } catch (error) {
            console.error(`Error permanently deleting note ${id}:`, error);
        }
    }
}

export const trashController = new TrashController();
