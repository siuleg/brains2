'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect, SetStateAction, Dispatch } from 'react';
import NotesCollection from '@/components/User-Notes/Notes-Collection';
import PopupWindow from '@/components/User-Notes/Popup-Window';
// import NoteCreatePopup from '@/components/User-Notes/Note-Create-Popup';

interface Notes {
    _id: string; 
    title: string; 
    content: string; 
    user_id: string;
    region?: string;
    created_at: string;
    updated_at: string;
    category?: string;
    hasAttachment?: boolean;
    collection?: string[];
};

interface userNotesPara {
  addedNote: boolean
}

const UserNote: React.FC<userNotesPara> = ({addedNote}) => {
    const router = useRouter();
    const baseUrl = `/flask-api`;
    const [notes, setNotes] = useState<Notes[]>([]);
    const [user_id, setUserID] = useState<string>('');
    const [selectedNote, setSelectedNote] = useState<Notes | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [authenticated, setAuthentication] = useState(false);

    // Getting the session's user ID
    useEffect(() => {
        const getUserID = async () => {
            try {
                const response = await fetch('flask-api/whoami', {
                    method: 'GET',
                    credentials: 'include',
                });
    
                if (!response.ok) {
                    throw new Error('Failed to get user ID');
                }
    
                const data = await response.json();
                setUserID(data.message);
            } catch (error) {
                setError('Failed to fetch user ID.');
            }
        }; getUserID();
    }, []);

    useEffect(() => {
        const isAuthenticated = async () => {
            await authenticateUser();
            if(authenticated) {
                fetchNotes();
            }
        }; isAuthenticated();
    }, []);

    useEffect(() => {
        if(authenticated) {
            fetchNotes();
        }
     }, [authenticated, user_id, addedNote]);

    // AUTHENTICATING users
    const authenticateUser = async () => {
        // event.preventDefault();
        try {
            const response = await fetch('flask-api/whoami', {
                method: 'GET',
                credentials: "include"
            });
            if(!response.ok) {
                throw new Error('User cannot be authenticated');
            }
            const data = await response.json();
            console.log(data);
            setAuthentication(true);
            setUserID(data.message);
        } catch (error) {
            setError('Authentication failed:');
            setAuthentication(false);
            router.push('/login');
        } finally {
            setLoading(false);
        }
    }

    // FETCHING all the notes from the database
    const fetchNotes = async () => {
        setLoading(true);
        try {
            if(!authenticated) {
                setError('User must be logged in.');
                router.push('/login');
                return;
            }

            const response = await fetch(`${baseUrl}/notes?user_id=${user_id}`);
            const data = await response.json();

            if(!response.ok) {
                console.log("Failed to fetch notes from API for user:", user_id, data); 
            }
            setNotes(data);
            console.log("Fetched notes from API for user:", user_id, data); 
        } catch (e) {
            setError('Failed to fetch notes.');
            console.error(e);
        } 
        finally {
            setLoading(false)
        }
    };

    // CREATING a new note
    const createNote = async (title: string, content: string, user_id: string) => {
        if(!authenticated) {
            setError('User must be logged in to create a note.');
            router.push('/login');
            return;
        }
        if(!title || !content || !user_id) {
            setError('Fill out required fields');
            return;
        }
        try {
            setLoading(true);
            console.log('Creating note:', { title, content, user_id });

            const response = await fetch(`${baseUrl}/notes/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    content,
                    user_id: user_id
                })
            });

            const data = await response.json()

            if(!response.ok) {
                setError('Failed to create a new note.');
                console.error('Error:', data);
                return;
            } 
         
            setSuccessMessage('Note created successfully!');
            await fetchNotes();
        } catch (e) {
            setError('Failed to create note.');
            console.error('Error creating note: ', e);
         }
         finally {
            setLoading(false);
         }
    };

    // EDITING an existing note
    const updateNote = async (noteID: string, title: string, content: string) => {
        if(!authenticated) {
            setError('User must be logged in to create a note.');
            router.push('/login');
            return;
        }
        if(!title || !content) {
            setError('error: No edits found');
            return;
        }
        try {
            setLoading(true);
            const response = await fetch(`${baseUrl}/notes/update/${noteID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    title, 
                    content,
                }),
            });

            const data = await response.json();

            if(!response.ok) {
                setError('Note did not update.');
                console.error('Error, note did not update.');
                return;
            }
            setSelectedNote(null);
            setSuccessMessage('Note updated successfully!');
            await fetchNotes();
        } catch (e) {
            setError('Error updating note.');
            console.error(e);
        }
        finally {
            setLoading(false);
        }
    };

    const handleEdit = (note: Notes, type: string) => {
        switch(type) {
            case 'popup':
                setSelectedNote(note);
                break;
            case 'page':
                router.push(`/notes/${note._id}`);
                break;
        }
    };

    // DELETING an existing note
    const deleteNote = async (noteID: string) => {
        try {
            const confirmation = window.confirm('Are you sure you want to delete this note?');
            console.log('Confirmation:', confirmation);

            if(confirmation) {  
                const response = await fetch(`${baseUrl}/notes/delete/${noteID}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if(!response.ok) {
                    setError('Error deleting note.');
                    console.error('Error deleting note.');
                    return;
                } else {
                    await fetchNotes();
                    console.log('Note deleted successfully!');
                }
            }
        } catch (e) {
            setError('Failed to delete note.');
            console.error(e);
        }
    };

    return (
        <div className="flex flex-col h-full ">
                <div className="flex-1">
                    <NotesCollection 
                        user_id = {user_id}
                        notes = {notes}
                        handleEdit = {handleEdit}
                        onDelete = {deleteNote}
                    />
                    {selectedNote && (
                    <PopupWindow
                        isOpen = {!!selectedNote}
                        note = {selectedNote}
                        onClose = {() => setSelectedNote(null)}
                        onSave = {async (updatedNote) => {
                            await updateNote(updatedNote._id, updatedNote.title, updatedNote.content);
                            setSelectedNote(null);
                        }}
                    />
                )}
                { error && (<div className="bg-red-100 border border-red-300 text-red-500 mt-2 px-4 py-3 mb-4">{error}</div>) }
                { successMessage && (<div className="bg-green-100 border border-green-400 text-green-700 mt-4 px-4 py-3 mb-4"> {successMessage}</div>) }
                </div>
            </div>
    );
};

export default UserNote;