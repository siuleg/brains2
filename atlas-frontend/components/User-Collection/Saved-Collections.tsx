// Display and manage the list of collections created by the user
'use client';

import React from 'react';
import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {Transition} from '@headlessui/react';
import {Menu, Folder} from 'lucide-react';
import CollSide from '../User-Collection/Sidebar-Collection';

interface Notes {
    _id: string;
    title: string;
    content: string;
    region?: string;
}

interface collectionItem {
    name: string;
    notes: Notes[];
    last_updated: Date;
}

interface LayoutProps {
    children: React.ReactNode;
}

const SavedCollection: React.FC<LayoutProps> = ({ children }) => {
    const baseUrl = `/flask-api`;
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [collectionName, setCollectionName] = useState('');
    const [collection, setCollection] = useState<collectionItem[]>([]);
    const [openCollection, setOpenCollection] = useState<Set<string>>(new Set())
    const [hoveredCollection, setHoveredCollection] = useState<string|null>(null);
    const [notes, setNotes] = useState<Notes[]>([]);
      
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };
      
    const navigation = [    
        { name: 'Home', href: '/'},
        { name: 'Atlas Viewer', href: '/atlas'},
        { name: 'Created Notes', href: '/notes'},
        // { name: 'Saved Articles', href: '/saved-articles'},
        // { name: 'Settings', href: '/settings'}, 
    ];

    useEffect(() => {
        fetchCollection();
    }, []);

    const [whoami, setWhoAmI] = useState<string | null>(null)
    const [role, setRole] = useState<string | null>(null)
      
    useEffect(() => {
        const pullWhoAmI = async () => {
            try {
                const response = await fetch(`flask-api/whoami`)
                const data = await response.json()

                if (data.error) {
                    console.log(data.errro)
                    router.push("/");
                } else {
                    setWhoAmI(data.message)
                    setRole(data.role)
                }
            } catch (err) {
                console.error("didn't even get data")
            }
        };
        pullWhoAmI()
    }, [ ])

    // CREATING a new collection
    const createNewCollection = async (name: string) => {
        try {
            console.log("Sending POST request to create new collection...");
            const response = await fetch(`${baseUrl}/collections`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    collectionName: name,
                }),
            });
            
            console.log("Response received:", response);
            if (!response.ok) {
                console.log(`Failed to create collection`);
                return;
            }
        
            const data = await response.json();
            console.log("Collection created", data);

            setCollection((prev) => [...prev, { name, notes: [], last_updated: new Date() }]);
            fetchCollection();
          } catch (e) {
            console.error('Error creating collection:', e);
        }
    }
    
    // FETCHING all the existing collections
    const fetchCollection = async () => {
        try {
            const response = await fetch(`${baseUrl}/collections/`, {
                method: 'GET',
                credentials: 'include',
            });

            if(!response.ok) {
                console.log(`Failed to fetch collection of notes.`);
                return;
            }

            const data = await response.json();
            const n  = Object.entries(data.collection)
                .map(([name, obj]: any) => ({
                    name,
                    notes: obj.notes as Notes[],
                    last_updated: new Date(obj.last_updated),
            }));

            setCollection(n);
            console.log('Collection', n);
        } catch(e) {
            console.error('Error fetching collection:', e)
        }
    };

    // DELETING a collection
    const deleteCollection = async (collectionName: string) => {
        const confirmation = window.confirm('Are you sure you want to delete this collection?');
        console.log('Confirmation:', confirmation);
        if (!confirmation) return;

        try {
            const response = await fetch(`${baseUrl}/collections/${collectionName}`, {
                method: 'DELETE',
            credentials: 'include'
            });

            const data = await response.json();    

            if(!response.ok) {
                console.log(`Failed to delete ${collectionName}`);
                fetchCollection();
            } else {
                fetchCollection();
                console.log(data.message);
            }
        } catch (e) {
            console.error('Error deleting note:', e)
        }
    };

    // REMOVING selected notes from collection
    const removeNote = async (noteID: string, collectionName: string) => {
        try {
            const response = await fetch(`${baseUrl}/collections/${collectionName}/remove`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ noteID }),
        });

        if(!response.ok) {
            console.log(`Failed to remove note from ${collectionName}`);
            return false;
        }

        setCollection(prev => prev.map(col => col.name === collectionName
            ? {...col, notes: col.notes.filter(n => n._id !== noteID) } : col
        ));
        return true;
        } catch (e) {
            console.error('Error removing note:', e)
            return false;
        }
    };

    // View the notes stored in the collection
    const toggleOpen = (collectionName: string) => {
        setOpenCollection(prev => {
            const selected = new Set(prev);
            if(selected.has(collectionName)) {
                selected.delete(collectionName)
            } else {
                selected.add(collectionName)
            } return selected;
        });
    };

    const handleEdit= (note: string) => {
        return
    }
    
    return (
        <div className="h-screen w-screen overflow-y-auto bg-gray-100 flex flex-col">                    
                    {/* Sidebar */}
                    {/* <Transition
                        show = {isSidebarOpen}
                        enter = "transition-all duration-300 ease-in-out"
                        enterFrom = "-ml-64"
                        enterTo = "ml-0"
                        leave = "transition-all duration-300 ease-in-out"
                        leaveFrom = "ml-0"
                        leaveTo = "-ml-64"
                    >
                        <div className = "bg-gray-800 text-white w-64 flex flex-col h-screen fixed top-0 left-0 shadow-md z-10">
                            <div className = "p-4 flex justify-between items-center">
                                <button onClick = {toggleSidebar} className = "text-gray-400 hover:text-white focus:outline-none">
                                    <Menu>
                                        <></>
                                    </Menu>
                                </button>
                            </div>

                            <nav className = "mt-4"> {
                                navigation.map((item) => (
                                <a key = {item.name}
                                    href = {item.href}
                                    className = {`flex items-center p-4 hover:bg-gray-700 ${
                                    router.pathname === item.href ? 'bg-gray-700 font-semibold' : ''}`}>
                                    <span>{item.name}</span>
                                </a>
                                ))}
                            </nav>
                        </div>
                    </Transition>

                    {!isSidebarOpen && (
                        <button
                            onClick = {toggleSidebar}
                            className = "fixed top-4 left-4 bg-gray-700 text-white rounded-md p-2 z-20 shadow-md focus:outline-none"
                        >
                            <svg className = "h-6 w-6" fill = "none" viewBox="0 0 24 24" stroke = "currentColor">
                                <path strokeLinecap = "round" strokeLinejoin = "round" strokeWidth = {2} d = "M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </button>
                    )} */}
                    <div className='flex'>
                        <div>
                        <CollSide user={whoami} role={role}/>
                        </div>
                    </div>
                    {/* Main Content Area */}
                    <div className='flex-1 ml-56'>
                        {/* Search Bar Area */}
                        {/* <div className="flex items-center justify-end h- bg-gray-100  py-2 px-2"> */}
                            {/* <div className="flex items-center p-4"> */}
                                {/* <SearchBar /> */}
                            {/* </div> */}
                        {/* </div> */}

                        {/* Create or Delete a collection of notes */}
                        <div className = "py-2 px-6">
                                <div className = 'p-4 mt-2 flex items-center justify-end '>
                                    {/* Form */}
                                    <input 
                                        type = "text"
                                        placeholder = 'Collection Name'
                                        value = {collectionName}
                                        onChange = {(e) =>
                                            setCollectionName(e.target.value)
                                        }
                                        className = "border border-gray-300 rounded-md focus:outline-none focus:border-blue-400 p-2 mr-2"
                                    />
                                    <button onClick = {() => {
                                        createNewCollection(collectionName)
                                        setCollectionName("")
                                    }}
                                        className = 'bg-white border px-4 py-2 mr-2 rounded hover:bg-gray-200'
                                        >
                                        Create Collection
                                    </button>
                                    {/* onclick popup
                                    - name
                                    - private/public */}
                                </div>
                            
                                {/* Table starts here */}
                                {/* Table header */}
                                <div className = "bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden">
                                    <table className = "min-w-full divide-y divide-gray-100">
                                        <thead>
                                            <tr className = "bg-gray-100">
                                                <th className = "px-6 py-4 text-left font-medium tracking-wider">
                                                    Collection Name
                                                </th>
                                                <th className = "px-6 py-4 text-left font-medium tracking-wider">
                                                    Date Modified {/*Last time a note was added*/}
                                                </th>
                                                <th className = "px-6 py-4 text-left font-medium tracking-wider">
                                                    Size
                                                </th>
                                                {/* <th className="px-4 py-3.5 text-left tracking-wider font-normal text-lg"> */}
                                                    {/* Delete */}
                                                    {/* Open */}
                                                {/* </th> */}
                                            </tr>
                                        </thead>

                                        {/* Table body */}
                                        <tbody>
                                            {collection.length > 0 ? ( 
                                                collection.map((col) => (
                                                    <React.Fragment key = {col.name}>
                                                        {/* On hover, display (Open) button */}
                                                        {/* On click, display the list of notes */}
                                                        {/* Then those are also clickable and you can view them in their respective page */}
                                                        <tr className = "hover:bg-gray-100"
                                                        
                                                            onMouseEnter = {() => setHoveredCollection(col.name)}
                                                            onMouseLeave = {() => setHoveredCollection(null)}
                                                        >
                                                        <td className="px-6 py-4 whitespace-wrap text-sm font-medium text-gray-800">
                                                        {/* <div className='flex items-center mr-2'> */}
                                                            {/* <Folder size = {16} fill = "none"/> */}
                                                            {col.name}
                                                        {/* </div> */}
                                                            {hoveredCollection === col.name && (
                                                                <div className="flex gap-2">
                                                                    <button onClick = {() => toggleOpen(col.name)} className = "text-gray-500 hover:text-blue-500  text-sm">
                                                                        {openCollection.has(col.name) ? 'Close' : 'Open'}
                                                                    </button>
                                                                    <button onClick = {() => deleteCollection(col.name)} className = "text-gray-500 hover:text-red-500 text-sm">
                                                                        Delete Collection
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                            {/* Date modified */}
                                                            <td className="px-6 py-4 whitespace-wrap text-sm font-medium text-gray-800">
                                                                {col.last_updated ? new Date(col.last_updated).toLocaleString(): 'N/A'}
                                                            </td>

                                                            {/* Number of notes in the collection */}
                                                            <td className="px-6 py-4 whitespace-wrap text-sm font-medium text-gray-800">
                                                                {col.notes.length} note{col.notes.length !== 1 ? 's' : ''}
                                                            </td>
                                                        </tr>
                                                            
                                                        {/* If the user selects (Open) display the notes from that collection*/}
                                                        {openCollection.has(col.name) &&
                                                            col.notes.map((note) => (
                                                                <tr key = {note._id} className = 'bg-green-100'>
                                                                    <td colSpan = {3} className = 'px-4 py-3.5 text-sm'>
                                                                        <div className='flex justify-between items-start'>
                                                                            <div>
                                                                                <p>{note.title}</p>
                                                                                <p>{note.content}</p>
                                                                            </div>
                                                                            {/* <div className='flex gap-3'>
                                                                                <button onClick={() => handleEdit(note._id)} className = 'hover:text-blue-500'>
                                                                                    Open
                                                                                </button>
                                                                                <button onClick={() => handleEdit(note._id)} className = 'hover:text-blue-500'>
                                                                                    Edit
                                                                                </button>
                                                                                <button onClick={() => removeNote(note._id, collectionName)} className = 'hover:text-red-500'>
                                                                                    Remove
                                                                                </button>
                                                                            </div> */}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                    </React.Fragment>
                                                ))
                                            ) : (
                                            <tr>
                                                <td className = "px-4 py-4 text-left text-gray-500">
                                                    No collections found.
                                                </td>
                                            </tr>
                                        )}
                                        </tbody>
                                    </table>
                            </div>
                        </div>
        </div>
        </div>
        );
    };
    export default SavedCollection;



