import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';

interface Notes {
    _id: string;
    title: string;
    content: string;
    region?: string;
}

interface PopupWindowProps {
    isOpen: boolean;
    onClose: () => void;
    userID: string
    addedNote: boolean
    setAdded: Dispatch<SetStateAction<boolean>>
}


const AddNotePopup: React.FC<PopupWindowProps> = ({ isOpen, onClose, userID, addedNote, setAdded }) => {
    const [title, setTitle] = useState("");
    const [regionNote, setRegionNote] = useState("")
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null) 

    if(!isOpen) return null;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {        
        event.preventDefault();
        setAdded(false)
        setLoading(true);
        setError(null);

        if(!title || !content) {
            setError('Fields are required');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`flask-api/notes/create`, {
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
            console.log('Note created successfully')
            setAdded(true)
            onClose()
            } catch (e) {
            setError('Failed to create note.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className = "bg-white p-6 rounded-lg w-full max-w-2xl">
            <h2 className = "text-xl font-bold mb-4">Create Note</h2>
            
            <form onSubmit = {handleSubmit}>
                <div className='flex items-center gap-2'>
                    <input
                        type = "text"
                        value = {title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder = "Title"
                        className = "w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:border-gray-600"
                    />
                    {/* Drop down? Get this data from the svg files. Or manual input? */}
                    <div className = 'flex flex-row gap-2'>
                        <input
                            type = "text"
                            value = {regionNote}
                            onChange={(event) => setRegionNote(event.target.value)}
                            placeholder = 'Region'
                            className = "w-full p-2 border rounded mb-4"
                        />
                    </div>
                </div>

                <textarea
                    value = {content}
                    placeholder = 'Note Content'
                    onChange={(event) => setContent(event.target.value)}
                    className = "w-full p-2 border rounded mb-4 h-48"
                />   

               {/* <SimpleEditor /> */} {/* RICH TEXT EDITOR */}

                <div className = "flex justify-end gap-2 mt-4">
                    <button onClick = {onClose} className = "px-4 py-2 bg-gray-200 rounded-md ml-2 hover:bg-gray-300">
                        Cancel
                    </button>
                    <button type = "submit" className = "px-4 py-2 bg-blue-500 text-white rounded-md ml-2 hover:bg-blue-600" disabled = {loading}>
                        {loading ? 'Saving...' : 'Save Note'}
                    </button>
                </div>   
            </form>
        </div>
    </div>
    );
};

export default AddNotePopup;