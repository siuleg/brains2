'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface NoteProps {
    onSubmit: (title: string, content: string) => void;
    initialTitle?: string;
    initialContent?: string;
    user_id?: string;
    disabled?: boolean;
    isEditing?: boolean;
    selectedText: string | null;
    onCancel?: () => void;
};

export default function CreateNote({onSubmit, initialTitle = '', initialContent = '', user_id = '', disabled, isEditing, selectedText, onCancel}: NoteProps) {
    const router = useRouter();
    const baseUrl = `/flask-api`;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null)
    const [title, setTitle] = useState(initialTitle);
    const [regionNote, setRegionNote] = useState(selectedText)
    const [content, setContent] = useState(initialContent);
    const [userID, setUserID] = useState<string | null>(null); 

    function ifNull(str: string | null) {
        if (str == null) {
            return ""
        }
        return str
    }

    useEffect(() => {
        const getUserID = async () => {
          try {
            const response = await fetch('flask-api/whoami', {
              method: 'GET',
              credentials: 'include',
            });
          
            if (!response.ok) {
                throw new Error('Failed to fetch user ID');
            }
            const data = await response.json();
            setUserID(data.message);
        } catch (error) {
           console.log('Failed to fetch user ID.');
        }}; getUserID();
      }, []);

    useEffect(() => {
        setTitle(initialTitle);
        setContent(initialContent);
        setRegionNote(ifNull(selectedText))
    }, [initialTitle, initialContent, selectedText]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {        
        event.preventDefault();
        setLoading(true);
        setError(null);

        if(!title || !content) {
            setError('Fields are required');
            setLoading(false);
            return;
        }

        if (!userID) {
            setError('You must be logged in to create a note.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${baseUrl}/notes/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    content,
                    region: regionNote || null,
                    user_id: userID,
                }),
                credentials: 'include'
            });

            const data = await response.json();
            console.log('Data', data);
    
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create note');
            }
            onSubmit(title, content);

            if(!isEditing) {
                setTitle('');
                setContent('');
                setRegionNote('');
            }
            console.log('Note created successfully')
            router.push('/notes');
         } catch (e) {
            setError('Failed to create note.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
        
    return (
        <form onSubmit = {handleSubmit}>
            <div className='grid grid-cols-6 gap-4'>
                <div className='col-span-5'>
                    <div className='flex flex-row'>
                        <div className = 'basis-3/4 mr-2'>
                            <input
                                type = "text"
                                value = {title}
                                onChange = {(event) => setTitle(event.target.value)}
                                placeholder = 'Note Title'
                                className="w-full px-3 py-2 border rounded bg-gray-200"
                            />      
                        </div>
                        <div className = 'basis-1/4 mb-2'>
                            <input
                                type = "text"
                                value = {ifNull(regionNote)}
                                onChange = {(event) => setRegionNote(event.target.value)}
                                placeholder = 'Selected Region'
                                className="w-full px-3 py-2 border rounded bg-gray-200"
                            />      
                        </div>
                    </div>
                    
                    <div>
                        <textarea
                            value = {content}
                            onChange = {(event) => setContent(event.target.value)}
                            placeholder = 'Enter details...'
                            className="w-full px-3 py-2 border rounded h-full overflow-y-auto bg-gray-200"
                        />
                    </div>
                </div>

                <div className='w-full font-medium text-gray-900 border-gray-200 rounded-lg dark:bg-gray-700 dark:text-white'>
                    <Link href = "/notes">
                        <button className = "px-4 py-2 w-full mb-2 bg-gray-400 hover:bg-gray-500 text-white rounded">View Notes</button>
                    </Link>
                    <button type = "submit" className = "px-4 py-2 w-full bg-gray-400 hover:bg-green-800 text-white rounded" disabled = {loading}>
                        {loading ? 'Saving...' : isEditing ? 'Update Note' : 'Save Note'}
                    </button>
                </div>
                
            </div>
        </form>
    )
}