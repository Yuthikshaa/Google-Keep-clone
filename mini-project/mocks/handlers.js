import { http, HttpResponse } from "msw";

export const SERVER_URL = 'http://localhost:5070';

let notesId = 1;
let notes = [];

export const handlers = [
    http.get(`${SERVER_URL}/notes`, ({ request }) => {
        const url = new URL(request.url);
        const searchQuery = url.searchParams.get('search')?.toLowerCase();
        const isTrashed = url.searchParams.get('isTrashed') === 'true';
    
        let filteredNotes = notes.filter(note => note.isTrashed === isTrashed);
    
        if (searchQuery) {
            filteredNotes = filteredNotes.filter(note =>
                note.title.toLowerCase().includes(searchQuery) ||
                note.content.toLowerCase().includes(searchQuery)
            );
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

    http.post(`${SERVER_URL}/notes`, async ({ request }) => {
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
        const { notesOrder } = await request.json();
    
        try {
            notesOrder.forEach(noteData => {
                const note = notes.find(n => n.id === Number(noteData.id));
                if (note) {
                    note.orderIndex = noteData.orderIndex;
                }
            });
    
            notes.sort((a, b) => a.orderIndex - b.orderIndex);
            console.log(notes);
            return HttpResponse.json({ message: 'Order updated successfully', updatedNotes: notes });
        } catch (error) {
            return HttpResponse.status(500).json({ message: 'Failed to update the order', error: error.message });
        }
    }),

    http.patch(`${SERVER_URL}/notes/:id`, async ({ request, params }) => {
        const note = notes.find((n) => n.id === Number(params.id));
        if (!note) {
            return HttpResponse(null, { status: 400 });
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
        return HttpResponse.json({ success: true, note });
    }),

    http.delete(`${SERVER_URL}/notes/:id`, async ({ params }) => {
        const noteIndex = notes.findIndex((n) => n.id === Number(params.id));
        if (noteIndex === -1) {
            return HttpResponse(null, { status: 400 });
        }
        notes.splice(noteIndex, 1);
        console.log(notes);
        return HttpResponse.json({ success: true });
    }),

    http.post(`${SERVER_URL}/notes/sync`, async ({ request }) => {
        const responseBody = await request.json();
        if (!responseBody || !responseBody.length) {
            return new HttpResponse(null, { status: 400 });
        }
        let updateNotes=[];
        const syncedNotes = [];
        const failedNotes = [];
        console.log("check",responseBody);
        for (const note of responseBody) {
            try {
                if (note.id < 0) {
                    const newNote = {
                        id: notesId++,
                        title: note.title,
                        content: note.content,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        isPinned: note.isPinned || false,
                        isTrashed: note.isTrashed || false,
                        deletedAt: note.deletedAt || null,
                        orderIndex: notes.length
                    };
                    notes.push(newNote);
                    updateNotes.push({ oldId: note.id, newId: newNote.id });
                    syncedNotes.push(newNote);
                } else {
                    const existingNote = notes.find(n => n.id === parseInt(note.id));
                    if (existingNote) {
                        existingNote.title = note.title || existingNote.title;
                        existingNote.content = note.content || existingNote.content;
                        existingNote.isPinned = note.isPinned ?? existingNote.isPinned;
                        existingNote.isTrashed = note.isTrashed ?? existingNote.isTrashed;
                        existingNote.deletedAt = note.deletedAt || existingNote.deletedAt;
                        existingNote.updatedAt = new Date().toISOString();
                        syncedNotes.push(existingNote);
                    } else {
                        const newNote = {
                            id: note.id,
                            title: note.title,
                            content: note.content,
                            createdAt: note.createdAt || new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            isPinned: note.isPinned || false,
                            isTrashed: note.isTrashed || false,
                            deletedAt: note.deletedAt || null,
                            orderIndex: notes.length
                        };
                        notes.push(newNote);
                        syncedNotes.push(newNote);
                    }
                }
            } catch (error) {
                failedNotes.push({ id: note.id, reason: error.message });
            }
            console.log(notes);
        }
    
        return HttpResponse.json({ success: true, syncedNotes, failedNotes,update:updateNotes });
    })
];
