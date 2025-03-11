import { worker } from '../mocks/server.js';
import { noteController } from './Controllers/NoteController.js';
import { noteModel } from './model/Notemodel.js';
import { noteView } from './views/NoteView.js';
import { trashController } from './Controllers/TrashController.js';
import { trashView } from './views/TrashView.js';
localStorage.clear();

async function enableMocking() {
    console.log("Starting mock server...");
    return worker.start({
        onUnhandledRequest: 'bypass',  
    });
}

function toggleViews(activeView) {
    const notesView = document.getElementById('notes-view');
    const trashView = document.getElementById('trash-view');
    const notesTab = document.getElementById('notes-tab');
    const trashTab = document.getElementById('trash-tab');

    if (!navigator.onLine && activeView === 'trash') {
        alert('You are offline. The Trash page cannot be accessed while offline.');
        return; 
    }
    
    console.log(`Toggling view to: ${activeView}`);

    if (activeView === 'notes') {
        notesView.style.display = 'block';
        trashView.style.display = 'none';
        notesTab.classList.add('active');
        trashTab.classList.remove('active');
        console.log('Showing Notes view');
    } else if (activeView === 'trash') {
        notesView.style.display = 'none';
        trashView.style.display = 'flex';
        notesTab.classList.remove('active');
        trashTab.classList.add('active');
        console.log('Showing Trash view');

        trashController.fetchTrashNotes();  
    }
}

enableMocking().then(() => {
    console.log('Mocking enabled!');

    window.noteView = noteView;
    window.noteController = noteController;
    window.noteModel = noteModel;
    window.trashView = trashView;
    window.trashController = trashController;

    toggleViews('notes');

    document.getElementById('notes-tab').addEventListener('click', () => {
        console.log('Notes tab clicked');
        toggleViews('notes');
    });

    document.getElementById('trash-tab').addEventListener('click', () => {
        console.log('Trash tab clicked');
        toggleViews('trash');
    });

    noteController.init();
});
