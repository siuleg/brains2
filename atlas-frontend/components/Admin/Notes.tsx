'use client';

import { useState, useEffect, SetStateAction, Dispatch } from "react";
import React from "react";

type noteInfo = {
    note_id: string
    content: string
    created: string
    name: string
    region: string
    public: boolean
    title: string
    updated: string
}

const NotesAdminView: React.FC = () => {

    const [notes, setNotesArr] = useState<null | noteInfo[]>([])
    const [notesChange, setNoteChange] = useState<boolean>(false)
    const [showAlertError, setShowAlertError] = useState(false)
    const [showAlertSuc, setShowAlertSuc] = useState(false)
    const [alertMessage, setAlertMessage] = useState<string | null>(null)

    function handlePublicStatus(username: string, noteId: string, pubilcStatus: boolean) {
        setAlertMessage(null)
        setShowAlertError(false)
        setShowAlertSuc(false)
        const updateUserField = async () => {
            try {
                const response = await fetch('flask-api/public-update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        noteid:  noteId,
                        value: !pubilcStatus,
                    })
                })
                const data = await response.json()

                if (response.ok) {
                    console.log(data.message)
                    setNoteChange(true)
                    setShowAlertSuc(true)
                    setAlertMessage("Note by author "+username+", public status was changed")
                } else {
                    setAlertMessage(data.error || 'Unknown error')
                    setShowAlertError(true)
                }
            } catch (err) {
                console.log("big mess up here")
                console.log(err)
                setAlertMessage("Major Error")
                setShowAlertError(true)
            }
        }
        updateUserField()
    }
    
    useEffect(() => {
        const pullAllNotes = async () => {
            try {
                const response = await fetch(`flask-api/get-all-notes`)
                const data = await response.json()

                if (data.error) {
                    console.error("Something bad")
                } else {
                    console.log(data)
                    setNotesArr(data["message"])
                }
            } catch (err) {
                console.log("didn't even get data")
                console.log(err)
                setAlertMessage("Major Error")
                setShowAlertError(true)
            }
        };
        pullAllNotes()
        setNoteChange(false)
    }, [notesChange, ])

    return (
        <div>
            <div className="flex">
                <div className="w-4/6 text-4xl font-bold text-black ps-2 m-3">
                    Notes Management
                </div>
                <div className="w-2/6 content-center mr-2">
                    {showAlertError && alertMessage && (
                        <div className=" w-full flex items-center justify-between bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <div className="flex items-start col-span-11">
                                <span className="block font-bold sm:inline">{alertMessage}</span>
                            </div>
                            <div className="flex items-start col-span-1" onClick={() => setShowAlertError(false)}>
                                <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                            </div>
                        </div>
                    )}
                    {showAlertSuc && (
                        <div className=" w-full flex items-center justify-between bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                            <div className="flex items-start col-span-11">
                                <span className="block font-bold sm:inline">{alertMessage}</span>
                            </div>
                            <div className="flex items-start col-span-1" onClick={() => setShowAlertSuc(false)}>
                                <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="h-[750] overflow-y-auto m-2">
                <table className="w-full text-gray-500">
                    <thead className="text-lg text-center text-white bg-[#1c2532] uppercase sticky top-0">
                        <tr>
                            <th scope="col" className="px-4 py-4">
                                Author
                            </th>
                            <th scope="col" className="px-4 py-4">
                                Title
                            </th>
                            <th scope="col" className="px-4 py-4">
                                Content
                            </th>
                            <th scope="col" className="px-4 py-4">
                                Region
                            </th>
                            <th scope="col" className="px-4 py-4">
                                Created
                            </th>
                            <th scope="col" className="px-4 py-4">
                                Updated
                            </th>
                            <th scope="col" className="px-4 py-4">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {notes && notes.map((note, index) => (
                            <tr className="bg-white border-b text-center border-gray-200 hover:bg-gray-300" key={index}>
                                <td className="px-4 py-4 font-medium text-gray-900 whitespace-nowrap">
                                    {note.name}
                                </td>
                                <td className="px-4 py-4 font-medium text-gray-900">
                                    {note.title}
                                </td>
                                <td className="px-4 py-4 font-medium text-gray-900">
                                    {note.content}
                                </td>
                                <td className="px-4 py-4 font-medium text-gray-900">
                                    {note.region}
                                </td>
                                <td className="px-4 py-4 font-medium text-gray-900">
                                    {note.created.substring(0,16)}
                                </td>
                                <td className="px-4 py-4 font-medium text-gray-900">
                                    {note.updated.substring(0,16)}
                                </td>
                                {note.public && 
                                    <td className="font-medium text-black border-l border-gray-200 bg-red-500">
                                        <button className="font-medium hover:underline" onClick={() => handlePublicStatus(note.name, note.note_id, note.public)}>Hide</button>
                                    </td>
                                }
                                {!note.public &&
                                    <td className="font-medium text-black border-l border-gray-200 bg-green-500">
                                        <button className="font-medium hover:underline" onClick={() => handlePublicStatus(note.name, note.note_id, note.public)}>Make Public</button>
                                    </td>
                                }
                                {/* <td className="font-medium text-gray-900 border-l border-gray-200">
                                    <button className="font-medium hover:underline" onClick={() => handlePublicStatus(note.name, note.note_id, note.public)}>{note.public? "Hide":"make public"}</button>
                                </td> */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default NotesAdminView