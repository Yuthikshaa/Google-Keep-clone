export class TrashView {
    constructor() {
        this.trashSection = document.querySelector("#trash-view"); 
    }

    displayTrashedNotes(trashedNotes) {
        if (!Array.isArray(trashedNotes)) {
            console.error("Invalid format for trashedNotes. Expected an array.");
            return;
        }
    
        if (!this.trashSection) {
            console.error("Trash section not found!");
            return;
        }
    
        this.trashSection.innerHTML = "";
    
        if (trashedNotes.length === 0) {
            this.trashSection.innerHTML = "<p>No trashed notes found.</p>";
        }
    
        trashedNotes.forEach(note => {
            const trashedNoteElement = document.createElement("div");
            trashedNoteElement.classList.add("trashed-note-item");
    
            trashedNoteElement.innerHTML = `
                <div class="trashed-note-item__header">
                    <textarea class="trashed-note-item__title" readonly>${note.title}</textarea>
                </div>
                <textarea class="trashed-note-item__content" readonly>${note.content}</textarea>
                <div class="trashed-note-item__footer">
                    <button class="trashed-note-item__delete-permanently"><img src="delete.PNG" alt="delete"></img></button>
                    <button class="trashed-note-item__restore"><img src="restore.PNG" alt="restore"></button>
                </div>
            `;
    
            this.trashSection.prepend(trashedNoteElement);
    
            trashedNoteElement.querySelector(".trashed-note-item__delete-permanently").addEventListener("click", () => {
                trashController.permanentlyDeleteNote(note.id, trashedNoteElement);
            });

            trashedNoteElement.querySelector(".trashed-note-item__restore").addEventListener("click", () => {
                trashController.restoreNote(note.id, trashedNoteElement);
            });
        });
    }            
}

export const trashView = new TrashView();