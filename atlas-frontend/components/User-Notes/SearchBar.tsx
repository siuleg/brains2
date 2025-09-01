'use client';

// Results of this search should be either filtering the collection of articles, or user notes, or displaying search results from API?
import React, { Dispatch, SetStateAction, useState } from 'react';
import { useRouter } from 'next/navigation';
import Form from 'next/form';
import AddNotePopup from './Add-Note-Popup';
import { FastForward } from 'lucide-react';

// here we are implementing the search bar component (reusable)

interface Note {
    _id: string
    title: string
    content: string
    region?: string
}

interface SearchNotesProps {
    user_id: string
    addedNote: boolean
    setAdded: Dispatch<SetStateAction<boolean>>
}
export default function SearchBar({ user_id, addedNote, setAdded}: SearchNotesProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();
    const [showModal, setShowModal] = useState(false);
    const [query, setQuery] = useState('')
    const [notes, setNotes] = useState<Note[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // const openModal = async(note: Notes) => {
    //     setShowModal(true);
    // }

    const search_notes = () => {
        return
    }
    
    return (
        <div className = "inline flex items-center">
        <form onSubmit = {search_notes}> {/* Form action .... using import */}
            <input 
                type = "text" 
                value = {searchTerm}
                onChange = {(e) => setSearchTerm(e.target.value)}
                placeholder = "Search Notes..."
                className = "border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-blue-400"
            />
            <button className = "bg-white border border-gray-300 hover:bg-gray-200 text-black py-2 px-4 rounded-md ml-2">Search</button>
            

        </form>
        <button onClick={() => setShowModal(true)} className = "bg-white border border-gray-300 hover:bg-gray-200 text-black py-2 px-4 rounded-md ml-2">
            Add New 
        </button>
        {/* Create sorting functionality */}
        {/* Create filtering functionality */}
        {showModal && (

            <AddNotePopup isOpen={showModal} onClose={() => (setShowModal(false))} userID={user_id} addedNote={addedNote} setAdded={setAdded}/>
                
                )}
        </div>
    )
}