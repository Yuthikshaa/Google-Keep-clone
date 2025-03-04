import { SERVER_URL } from "../../mocks/handlers";

export class NoteModel {
    async fetchNotes() {
        try {
            // Include the isTrashed=false query parameter in the fetch call
            const response = await fetch(`${SERVER_URL}/notes?isTrashed=false`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            const data = await response.json();
            console.log("Fetched non-trashed notes from server:", data.notes); // Log the fetched non-trashed notes
            
            return Array.isArray(data.notes) ? data.notes : [];
        } catch (error) {
            console.error("Error fetching notes, retrying in 1 second...", error);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Retry after 1 second
            return this.fetchNotes(); 
        }
    }    

    async saveNote(note) {
        try {
            const response = await fetch(`${SERVER_URL}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(note),
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const result = await response.json(); // Expecting { id, success: true }
    
            if (!result || !result.id) {
                throw new Error("Note was saved but no ID returned");
            }
    
            return { ...note, id: result.id }; // Return the note with its ID
        } catch (error) {
            console.error("Error saving note:", error);
            return null; // Return null if save fails
        }
    }            
  

    async updateNote(id, updatedData) {
        try {
            const response = await fetch(`${SERVER_URL}/notes/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });
            return response.ok;
        } catch (error) {
            console.error("Error updating note:", error);
            return false;
        }
    }

    async trashNote(id) {
        try {
            const response = await fetch(`${SERVER_URL}/notes/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isTrashed: true, isPinned: false }),
            });
    
            if (response.ok) {
                const result = await response.json();
                console.log('Trashed note response:', result); 
                return true;
            } else {
                throw new Error('Failed to trash the note');
            }
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
    
    
}
export const noteModel = new NoteModel();
