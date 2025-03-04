import { noteController } from "../Controllers/NoteController.js";

export class NoteView {
    constructor() {   
        document.addEventListener("DOMContentLoaded", () => {
            console.log("DOMContentLoaded event fired!");
            this.header = document.querySelector(".note__header");
            this.footer = document.querySelector(".note__footer");
            this.content = document.querySelector(".note__content");
            this.title = document.querySelector(".note__title");
            this.pin = document.querySelector(".note__pin");
            this.closeBtn = document.querySelector(".note__close");
            this.searchInput = document.querySelector('.search-bar__input');

            this.pinnedSection = document.querySelector(".notes-grid--pinned");
            this.othersSection = document.querySelector(".notes-grid--others");

            this.notesViewDiv = document.getElementById('notes-view');
            this.filteredNotesDiv = document.getElementById('filtered-notes');

            this.isPinned = false; 

            this.pin.addEventListener("click", () => this.togglePin());
            this.closeBtn.addEventListener("click", () => this.handleAddNote());
            this.searchInput.addEventListener('input', this.debounce((e) => this.handleSearch(e.target.value), 1000));  
        });
    }

    debounce(fn, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                fn.apply(this, args);
            }, delay);
        };
    }

    handleSearch(query) {
        if (query.trim() === "") {
            this.showMainNotes();
            return;
        }
        noteController.searchNotes(query);
    }

    displayMatchedNotes(notes) {
        this.filteredNotesDiv.innerHTML = '';
        if (notes.length > 0) {
            this.showFilteredNotes(notes);
        } else {
            this.showMainNotes(); 
        }
    }

    showFilteredNotes(notes) {
        this.notesViewDiv.classList.add('hidden');
        this.filteredNotesDiv.classList.remove('hidden');
        this.filteredNotesDiv.innerHTML = "";

        notes.forEach(note => {
            const noteElement = document.createElement("div");
            noteElement.className = "note";

            noteElement.innerHTML = `
            <h3>${note.title}</h3>
            <p>${note.content}</p>
            `;

            this.filteredNotesDiv.appendChild(noteElement);
        });
    }

    showMainNotes() {
        this.filteredNotesDiv.classList.add('hidden');
        this.notesViewDiv.classList.remove('hidden');
    }

    expand() {
        if (this.header && this.footer) {
            this.header.style.display = "block";
            this.footer.style.display = "block";
        } else {
            console.error("Header or Footer not found!");
        }
    }

    togglePin() {
        this.isPinned = !this.isPinned;
        this.pin.src = this.isPinned ? "pinned.png" : "pin.png";
        this.pin.alt = this.isPinned ? "Pinned" : "Unpin";
    }

    handleAddNote() {
        const title = this.title.value.trim();
        const content = this.content.value.trim();

        if (!title && !content) {
            this.resetNote();
            return;
        }

        noteController.addNote(title, content, this.isPinned);
        this.resetNote();
    }

    displayNote(note) {
        const noteElement = document.createElement("div");
        noteElement.classList.add("note-item");
        noteElement.setAttribute('data-id', note.id);
        noteElement.innerHTML = `
            <div class="note-item__header"> 
                <textarea class="note-item__title" readonly>${note.title}</textarea> 
                <img src="${note.isPinned ? 'pinned.png' : 'pin.png'}" alt="${note.isPinned ? 'Pinned' : 'Unpin'}" class="note-item__pin">
            </div>
            <textarea class="note-item__content" readonly>${note.content}</textarea> 
            <div class="note-item__footer"> 
                <button class="note-item__view">View</button>  
                <button class="note-item__edit">✏️</button>
                <button class="note-item__delete"><img src="archive.png" alt="archive"></button>
            </div>
        `;

        noteElement.querySelector(".note-item__pin").addEventListener("click", (event) => {
            const clickedNoteElement = event.target.closest(".note-item"); 
            if (clickedNoteElement) {
                this.swap(note, clickedNoteElement);  
            }
        });

        noteElement.querySelector(".note-item__view").addEventListener("click", () => {
            this.openFullScreen(note);
        });
        noteElement.querySelector(".note-item__edit").addEventListener("click", () => {
            this.openEditMode(note, noteElement);
        });
        noteElement.querySelector(".note-item__delete").addEventListener("click", () => {
            noteController.trashNote(note.id, noteElement);
        });        

        noteElement.addEventListener("mouseenter", () => {
            noteElement.querySelector(".note-item__pin").style.display = "block";
            noteElement.querySelector(".note-item__footer").style.display = "block";
        });

        noteElement.addEventListener("mouseleave", () => {
            noteElement.querySelector(".note-item__pin").style.display = "none";
            noteElement.querySelector(".note-item__footer").style.display = "none";
        });

        // Event listeners for drag and drop
        noteElement.addEventListener("dragstart", (event) => this.handleDragStart(event, note));
        noteElement.addEventListener("dragover", this.handleDragOver);
        noteElement.addEventListener("dragenter", this.handleDragEnter);
        noteElement.addEventListener("dragleave", this.handleDragLeave);
        noteElement.addEventListener("drop", (event) => this.handleDrop(event, note));
        noteElement.addEventListener("dragend", this.handleDragEnd);

        noteElement.setAttribute('draggable', true);

        if (note.isPinned) {
            this.pinnedSection.prepend(noteElement);
        } else {
            this.othersSection.prepend(noteElement);
        }
    }

    openFullScreen(note) {
        const modal = document.createElement("div");
        modal.classList.add("note-modal");
        modal.innerHTML = `
            <div class="note-modal__content">
                <button class="note-modal__close">&times;</button>
                <h2>${note.title}</h2>
                <p>${note.content}</p>
            </div>
        `;
    
        document.body.appendChild(modal);
    
        modal.querySelector(".note-modal__close").addEventListener("click", () => {
            modal.remove();
        });
    
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.remove();
        });
    }   

    openEditMode(note, noteElement) {
        if (!note.id) {
            console.error("Error: Trying to edit a note without an ID", note);
            return;
        }
        const modal = document.createElement("div");
        modal.classList.add("note-modal");
        modal.innerHTML = `
            <div class="note-modal__content">
                <button class="note-modal__close">&times;</button>
                <textarea class="note-modal__title">${note.title}</textarea>
                <textarea class="note-modal__body">${note.content}</textarea>
                <button class="note-modal__save">Save</button>
            </div>
        `;
    
        document.body.appendChild(modal);
    
        const titleField = modal.querySelector(".note-modal__title");
        const contentField = modal.querySelector(".note-modal__body");
        const closeButton = modal.querySelector(".note-modal__close");
        const saveButton = modal.querySelector(".note-modal__save");
    
        let originalTitle = note.title;
        let originalContent = note.content;
    
        closeButton.addEventListener("click", () => modal.remove());
        modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
    
        saveButton.addEventListener("click", async () => {
            const updatedTitle = titleField.value.trim();
            const updatedContent = contentField.value.trim();
            let patchRequests = [];
    
            if (updatedTitle !== originalTitle) {
                patchRequests.push(noteController.updateNote(note.id, { title: updatedTitle }));
            }
            if (updatedContent !== originalContent) {
                patchRequests.push(noteController.updateNote(note.id, { content: updatedContent }));
            }
    
            note.title = updatedTitle;
            note.content = updatedContent;

            if (patchRequests.length > 0) {
                await Promise.all(patchRequests);
                noteElement.querySelector(".note-item__title").value = updatedTitle;
                noteElement.querySelector(".note-item__content").value = updatedContent;
            }
    
            modal.remove();
        });
    }    

    resetNote() {
        this.title.value = "";
        this.content.value = "";
        this.header.style.display = "none";
        this.footer.style.display = "none";
        this.isPinned = false;
        this.pin.src = "pin.png";
        this.pin.alt = "Unpin";
    }

    
    swap(note, noteElement) {
        if (note.isPinned) {
            this.moveNoteToOthers(note, noteElement);
        } else {
            this.moveNoteToPinned(note, noteElement);
        }
        noteController.updatePinStatus(note);
    }
    
    moveNoteToPinned(note, noteElement) {
        const pinnedSection = document.querySelector(".notes-grid--pinned"); 
        const pinIcon = noteElement.querySelector(".note-item__pin");
    
        if (pinnedSection && pinIcon) {
            noteElement.remove();
            pinnedSection.prepend(noteElement);
            note.isPinned = true;
    
            pinIcon.src = "pinned.png"; 
            pinIcon.alt = "Pinned";
    
            console.log(`Note ${note.id} moved to pinned.`);
        } else {
            console.error("Pinned section or pin icon not found!");
        }
    }
    
    moveNoteToOthers(note, noteElement) {
        const othersSection = document.querySelector(".notes-grid--others");
        const pinIcon = noteElement.querySelector(".note-item__pin");
    
        if (noteElement && othersSection && pinIcon) {
            noteElement.remove();  
            othersSection.prepend(noteElement);  
            note.isPinned = false;  
    
            pinIcon.src = "pin.png"; 
            pinIcon.alt = "Unpin";
    
            console.log(`Note ${note.id} moved to others.`);
        } else {
            console.error("Others section, note element, or pin icon not found!");
        }
    }    
    
    handleDragStart(event, note) {
        console.log('Drag started for note:', note.id);
        event.dataTransfer.setData('text/plain', note.id);
        event.target.classList.add('dragging');
    }
    
    handleDragOver(event) {
        event.preventDefault();  // Allow dropping by preventing the default behavior
        console.log('Drag over:', event.target);
        event.target.classList.add('drag-over');
    }
    
    handleDragEnter(event) {
        console.log('Drag enter:', event.target)
        event.target.classList.add('drag-over');
    }
    
    handleDragLeave(event) {
        console.log('Drag leave:', event.target);
        event.target.classList.remove('drag-over');
    }
    
    async handleDrop(event, targetNote) {
        event.preventDefault();
        const draggedNoteId = event.dataTransfer.getData('text/plain');
        const draggedElement = document.querySelector(`[data-id='${draggedNoteId}']`);
    
        console.log(`Drop event: draggedNoteId = ${draggedNoteId}, targetNote = ${targetNote.id}`);
        
        if (draggedElement && draggedElement !== event.target) {
            const draggedNote = await noteController.getNoteById(draggedNoteId);
    
            console.log("Dragged note data:", draggedNote);
            console.log("Target note data:", targetNote);
    
            if (draggedNote.isPinned === targetNote.isPinned) {
                const targetSection = targetNote.isPinned ? this.pinnedSection : this.othersSection;
    
                // Insert the dragged note before the target note
                targetSection.insertBefore(draggedElement, event.target.closest('.note-item'));
    
                // Get the new order of the notes in the section after the drop
                const updatedOrder = Array.from(targetSection.querySelectorAll('.note-item'))
                    .map((noteEl, index) => {
                        const noteId = noteEl.getAttribute('data-id');
                        return { id: noteId, orderIndex: index };
                    });
    
                console.log("Updated order:", updatedOrder);
    
                noteController.updateNoteOrder(updatedOrder);
    
                console.log(`Moved note ${draggedNoteId} to new position before note ${targetNote.id}`);
            } else {
                console.log('Cannot move note between pinned and others sections');
            }
        }
    
        event.target.classList.remove('drag-over');
    }    
    
    handleDragEnd(event) {
        console.log('Drag ended');  
        event.target.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    }    
    
}

export const noteView = new NoteView();
