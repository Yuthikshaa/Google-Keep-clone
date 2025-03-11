import { SERVER_URL } from "../../mocks/handlers";

export class NoteModel {
    async fetchNotes() {
        try {
            const response = await fetch(`${SERVER_URL}/notes?isTrashed=false`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            return Array.isArray(data.notes) ? data.notes : [];
        } catch (error) {
            console.error("Error fetching notes:", error);
            throw error;
        }
    }   

    async saveNote(note) {
        if (!navigator.onLine) {
            const tempId = this.generateTemporaryId();
            this.saveOfflineChange(tempId, note);
            return { ...note, id: tempId };
        }
    
        try {
            const response = await fetch(`${SERVER_URL}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(note),
            });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const result = await response.json();
            return { ...note, id: result.id }; 
        } catch (error) {
            console.error("Error saving note:", error);
            return null;
        }
    }  
                  
    generateTemporaryId() {
        return `-${Date.now()}`;
    }

    async updateNote(id, updatedFields) {
        if (!navigator.onLine) {
            this.saveOfflineChange(id, updatedFields);
            return { id, ...updatedFields };
        }
    
        try {
            console.log("Sending patch request to server:", updatedFields); 
            const response = await fetch(`${SERVER_URL}/notes/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedFields), 
            });
    
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            const result = await response.json();
            console.log("Server response:", result); 
            return { id, ...result }; 
        } catch (error) {
            console.error("Error updating note:", error);
            return null;
        }
    }    
           
    async trashNote(id) {
        if (!navigator.onLine) {
            this.saveOfflineChange(id, { isTrashed: true });
            return true;
        }

        try {
            const response = await fetch(`${SERVER_URL}/notes/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isTrashed: true }),
            });
            return response.ok;
        } catch (error) {
            console.error("Error trashing note:", error);
            return false;
        }
    }    

    async getTrashedNotes() {
        try {
            const response = await fetch(`${SERVER_URL}/notes?isTrashed=true`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
    
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    
            const data = await response.json();
            console.log("Fetched trashed notes from server:", data.notes); 
    
            return Array.isArray(data.notes) ? data.notes : [];
        } catch (error) {
            console.error("Error fetching trashed notes:", error);
            return [];
        }
    }    
        

    async deleteNote(id) {
        try {
            const response = await fetch(`${SERVER_URL}/notes/${id}`, {
                method: "DELETE",
            });
            return response.ok;
        } catch (error) {
            console.error("Error deleting note:", error);
            return false;
        }
    } 
    
    async updateNotePinStatus(note) {
        const updatedNote = {
            ...note,
            isPinned: note.isPinned 
        };

        return fetch(`${SERVER_URL}/notes/${note.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedNote)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to update note ${note.id}`);
            }
            return response.json();
        });
    }

    async getNoteById(id) {
        try {
            const response = await fetch(`${SERVER_URL}/notes/${id}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (response.ok) {
                const note = await response.json();
                return note;
            } else {
                throw new Error(`Failed to fetch note with id ${id}`);
            }
        } catch (error) {
            console.error("Error fetching note by ID:", error);
            return null;
        }
    }

    async searchNotes(query) {
        try {
            const response = await fetch(`${SERVER_URL}/notes?search=${query}`);
            if (response.ok) {
                const { notes } = await response.json();
                return notes;  
            } else {
                throw new Error('Failed to fetch notes');
            }
        } catch (error) {
            console.error("Error searching notes:", error);
            return [];
        }
    }

    async updateNoteOrderOnServer(updatedOrder) {
        try {
            const response = await fetch(`${SERVER_URL}/notes/update-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notesOrder: updatedOrder }),
            });
    
            if (response.ok) {
                const result = await response.json();
                console.log('Order updated successfully on the server:', result);
                noteController.updateNoteOrderInView(result.updatedNotes);
            } else {
                console.error('Failed to update order on the server');
            }
        } catch (error) {
            console.error('Error updating order on server:', error);
        }
    }   
    
    async syncNotesToServer(notes) {
        try {
            const response = await fetch(`${SERVER_URL}/notes/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(notes),  
            });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return await response.json(); 
        } catch (error) {
            console.error("Error syncing notes to server:", error);
            throw error;
        }
    }

}
export const noteModel = new NoteModel();