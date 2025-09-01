'use client'

import React, { useState, useMemo } from 'react';
import { Folder, Pencil, Trash } from 'lucide-react';

interface Notes {
    _id: string;
    title: string;
    content: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    region: string;
    category?: string;
    hasAttachment?: boolean;
};

interface NoteProps {
    user_id: string;
    notes: Notes[];
    handleEdit: (note: Notes, type: string) => void;
    onDelete: (noteID: string) => void;
}

export default function NotesCollection({user_id, notes, onDelete, handleEdit}: NoteProps) {
    const baseUrl = `/flask-api`;
    const [sortOption, setSortOption] = useState("newest");
    const [selectedNote, setSelectedNote] = useState<Notes | null>(null);
    const [createNewCollection, setNewCollection] = useState<string>('');
    const [selectedCollection, setSelectedCollection] = useState<string>('');
    const [collection, setCollection] = useState<string[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    
    const openModal = async(note: Notes) => {
        setSelectedNote(note);
        setShowModal(true);
        const response = await fetch (`${baseUrl}/collections`);
        const data = await response.json();
        const collectionNames = Object.keys(data.collection || {});
        setCollection(collectionNames);
    }

    const handleAddNote = async() => {
        try{
            const response = await fetch(`${baseUrl}/collections/add`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    note: selectedNote,
                    collectionName: selectedCollection ||  newCollectionName
                }),
              });
    
              const data = await response.json();

              if(response.ok) {
                console.log('Note added to collection', data);
                setShowModal(false);
                setSelectedNote(null);
                setSelectedCollection('');
                setNewCollectionName('');
            } else {
                console.error('Failed to add note:', data.error);
            }
        } catch(e) {
            console.error('Problem adding note', e)
        }

    }

    // Sort notes according to selected sort option
    const sortedNotes = useMemo(() => {
        return [...notes].sort((a, b) => {
            if (sortOption === "newest") {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            } else if (sortOption === "oldest") {
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            } else if (sortOption === "title-az") {
                return a.title.localeCompare(b.title);
            } else if (sortOption === "title-za") {
                return b.title.localeCompare(a.title);
            }
            return 0;
        });
    }, [notes, sortOption]);

    return (
        <div>
            <div className = 'flex items-center justify-end text-sm'>
                {/* Sort and filter buttons */}
                <div className="gap-2 flex justify-end pt-4 pr-1 pb-4">
                    {/* <button>Filter</button> */}

                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                    >
                        <option value="newest">Newest to Oldest</option>
                        <option value="oldest">Oldest to Newest</option>
                        <option value="title-az">Title A-Z</option>
                        <option value="title-za">Title Z-A</option>
                    </select>
                </div>
            </div>

             {/* Table starts here */}
             {/* Table header */}
             <div className = "bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden">
                 <table className = "min-w-full divide-y divide-gray-100">
                     <thead>
                         <tr className = "bg-gray-100">
                             {/* <th className = "px-6 py-4 text-left text-sm font-medium text-gray-500 tracking-wider">
                                 <input disabled type = "checkbox"></input>
                             </th> */}
                             {/* <th className = "px-6 py-4 text-left text-sm font-medium text-gray-500 tracking-wider">
                                 Tag
                             </th> */}
                             <th className = "px-6 py-4 text-left font-medium tracking-wider">
                                 Title
                             </th>
                             <th className = "px-6 py-4 text-left font-medium tracking-wider">
                                 Author(s)
                             </th>
                             <th className = "px-6 py-4 text-left font-medium tracking-wider">
                                 Details
                             </th>
                             <th className = "px-6 py-4 text-left font-medium tracking-wider">
                                 Region {/* related to specified region of the brain */}
                             </th>
                             {/* <th className = "px-6 py-4 text-left text-sm font-medium text-gray-500 tracking-wider">
                                 Journal
                             </th> */}
                             <th className = "px-6 py-4 text-left font-medium tracking-wider">
                                 Year
                             </th>
                             {/* <th className = "px-6 py-4 text-left text-sm font-medium text-gray-500 tracking-wider">
                                 Attachments
                             </th> */}
                             {/* <th className = "px-6 py-4 text-left text-sm font-medium text-gray-500 tracking-wider">
                                 Notes
                             </th> */}
                             <th className = "px-6 py-4 text-left font-medium tracking-wider">
                                 Last Updated
                             </th>
                             <th className = "px-6 py-4 text-left font-medium tracking-wider"></th>    
                         </tr>
                     </thead>
    
                    {/* Table's BODY */}
                    <tbody>
                        { notes?.length > 0 ? ( 
                            sortedNotes.map((note) => (
                                <React.Fragment key = {note._id}>
                                    <tr className = "hover:bg-gray-100">
                                        <td className="px-6 py-4 whitespace-wrap text-sm font-medium text-gray-800">
                                            {note.title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-wrap text-sm font-medium text-gray-800">
                                            {user_id.charAt(0).toUpperCase() + user_id.slice(1)}
                                        </td>
                                        <td className = "px-6 py-4 whitespace-wrap text-sm font-medium text-gray-800">
                                            {note.content}
                                        </td>
                                        <td className="px-6 py-4 whitespace-wrap text-sm font-medium text-gray-800">
                                            {/* TO-DO: Based on the region selected, the color changes. Need to add a function that randomizes color only for different groups. */}
                                            {note.region && ( 
                                                <span className="inline-flex items-center rounded bg-blue-500 px-2 py-1 text-sm text-white">
                                                    {note.region}
                                                </span>
                                            )}
                                        </td>
                                        {/* <td className = "px-6 py-4 whitespace-wrap text-sm font-medium text-gray-800"> */}
                                            {/* journal source if applicable */}
                                        {/* </td> */}
                                        <td className = "px-6 py-4 whitespace-wrap text-sm font-medium text-gray-800">
                                            {new Date(note.created_at).getFullYear()}
                                        </td>
                                        {/* <td className = "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800"> */}
                                            {/* attachments, if any */}
                                        {/* </td> */}
                                        {/* <td className = "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800"> */}
                                            {/* comments, if any */}
                                        {/* </td> */}
                                        <td className = "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                                            {new Date(note.updated_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                            })}
                                        </td>
                                        <td colSpan = {3} className = 'px-6 py-3 text-sm'>
                                            <div className='flex justify-end items-start'>
                                                <div className = 'flex gap-10'>
                                                    <button title = "Edit" onClick = {() => handleEdit(note, 'popup')}>  
                                                        <Pencil size = {16} fill = "none"/>
                                                    </button>
                                                    <button title = "Add to Collection" onClick={() => openModal(note)}>
                                                        <Folder size = {16} fill = "none"/>
                                                    </button>
                                                    <button title = "Delete" onClick = {() => onDelete(note._id)}>
                                                        <Trash size = {16} fill = "none"/>
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>                             
                                </React.Fragment>
                            ))
                        ):(
                        <tr>
                            <td colSpan = {5} className = "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                                No notes found.
                            </td>
                        </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className = "bg-white p-6 rounded-lg w-full max-w-lg">
                        <h2 className = "text-xl font-bold mb-4">Add Note to a Collection</h2>
                            <label>Select Collection:</label>
                                <select
                                    className="border w-full p-2 mb-2"
                                    value={selectedCollection}
                                    onChange={(e) => setSelectedCollection(e.target.value)}
                                >
                                    <option value="">---</option>
                                        {collection.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>

                                <label>Create a New Collection:</label>
                                <input
                                    className = "border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-blue-400"
                                    placeholder = "New Collection Name"
                                    value = {newCollectionName}
                                    onChange={(e) => setNewCollectionName(e.target.value)}
                                />
                                <div className = "flex justify-end gap-2">
                                    <button onClick = {() => setShowModal(false)} className = "px-4 py-2 bg-gray-200 rounded-md ml-2 hover:bg-gray-300">Cancel</button>
                                    <button onClick = {handleAddNote} className = "px-4 py-2 bg-blue-500 text-white rounded-md ml-2 hover:bg-blue-600">Submit</button>
                                </div>
                        </div>
                    </div>
                    )}
        </div>
        );
    };