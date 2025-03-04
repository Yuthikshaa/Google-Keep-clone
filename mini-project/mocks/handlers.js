import { http, HttpResponse } from "msw";

export const SERVER_URL = 'http://localhost:5070';

let notesId = 1;
let notes = [];

export const handlers = [
    http.get(`${SERVER_URL}/notes`, ({ request }) => {
        const url = new URL(request.url);
        const searchQuery = url.searchParams.get('search')?.toLowerCase();
        const isTrashed = url.searchParams.get('isTrashed') === 'true';
    
        let filteredNotes = notes;
    
        filteredNotes = filteredNotes.filter(note => note.isTrashed === isTrashed);
    
        if (searchQuery) {
            filteredNotes = filteredNotes.filter(note =>
                note.title.toLowerCase().includes(searchQuery) ||
                note.content.toLowerCase().includes(searchQuery)
            );
            console.log(filteredNotes);
        }
    
        return HttpResponse.json({ notes: filteredNotes });
    }),        
    http.get(`${SERVER_URL}/notes/:id`, ({ params }) => {
        const noteId = parseInt(params.id, 10);  
        const note = notes.find(note => note.id === noteId);
    
        if (note) {
            return HttpResponse.json(note);
        } else {
            return HttpResponse.status(404).json({ error: "Note not found" });
        }
    }),     
    http.post(`${SERVER_URL}/notes`, async ({ request, params, cookies }) => {
        const requestBody = await request.json();
        
        if (!requestBody.title && !requestBody.content) {
            return HttpResponse(null, { status: 400 });
        }
    
        const now = new Date().toISOString();   
        const newNote = {
            id: notesId++,       
            title: requestBody.title,
            content: requestBody.content,
            createdAt: now,      
            updatedAt: now,      
            isPinned: requestBody.isPinned,     
            isTrashed: false,    
            deletedAt: null,     
            orderIndex: notes.length  
        };
    
        notes.push(newNote);  
        console.log(notes);
        return HttpResponse.json({ id: newNote.id, success: true }); 
    }), 
    http.post(`${SERVER_URL}/notes/update-order`, async ({ request }) => {
        const { notesOrder } = await request.json(); // This will be an array of { id, orderIndex }
    
        try {
            // Update each note's orderIndex based on the new order
            notesOrder.forEach(noteData => {
                const note = notes.find(n => n.id === Number(noteData.id));
                if (note) {
                    note.orderIndex = noteData.orderIndex;
                }
            });
    
            // Sort the notes based on the new orderIndex
            notes.sort((a, b) => a.orderIndex - b.orderIndex);
    
            console.log('Updated notes order:', notes);
    
            // Return the updated list of notes
            return HttpResponse.json({
                message: 'Order updated successfully',
                updatedNotes: notes, // Return updated notes if needed
            });
        } catch (error) {
            console.error('Error updating order:', error);
            return HttpResponse.status(500).json({
                message: 'Failed to update the order',
                error: error.message,
            });
        }
    }),
    http.patch(`${SERVER_URL}/notes/:id`, async ({ request, params, cookies }) => {
        const note = notes.find((n) => n.id === Number(params.id));
        if (!note) {
            return new HttpResponse(null, { status: 400 });
        }
    
        const requestBody = await request.json();
        
        if (requestBody.title) {
            note.title = requestBody.title;
        }
        if (requestBody.content) {
            note.content = requestBody.content;
        }
        if (requestBody.isPinned !== undefined) {
            note.isPinned = requestBody.isPinned;
        }
        if (requestBody.isTrashed !== undefined) {
            note.isTrashed = requestBody.isTrashed;
        }
        if (requestBody.deletedAt) {
            note.deletedAt = requestBody.deletedAt;
        }
        if (requestBody.orderIndex !== undefined) {
            note.orderIndex = requestBody.orderIndex;
        }
    
        note.updatedAt = new Date().toISOString(); 

        console.log(notes);
        return HttpResponse.json({ success: true });
    }),    
    http.delete(`${SERVER_URL}/notes/:id`, async ({ request, params, cookies }) => {
        const noteIndex = notes.findIndex((n) => n.id === Number(params.id));
        if (noteIndex === -1) {
            return new HttpResponse(null, { status: 400 });
        }
        notes.splice(noteIndex, 1);
        console.log(notes);
        return new HttpResponse(
            JSON.stringify({ success: true }),  
            { status: 200 }                    
        );
    }),
    http.post(`${SERVER_URL}/notes/sync`, async ({ request, params, cookies }) => {
        const responseBody = await request.json();
        if (!responseBody.notes || !responseBody.notes.length) {
            return HttpResponse(null, { status: 400 });
        }
        notes = responseBody.notes;
        
        return HttpResponse.json({ success: true });
    })
];
