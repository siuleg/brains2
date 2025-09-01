'use client'

import React, { useEffect, useState } from "react";

type regionInfo = {
    selectedRegion: string | null;
};

type UserNotes = {
    author: string;
    content: string;
    title: string;
}

type PaperResult = {
    reference: string;
    title?: string;
    link?: string;
    snippet?: string;
    error?: string;
    alreadyAdded?: boolean;
};

const RegionInfo: React.FC<regionInfo> = ({ selectedRegion }) => {
    const [regionName, setRegionName] = useState<string | null>(null);
    const [endnote, setEndnote] = useState<string | null>(null);
    const [papers, setPapers] = useState<PaperResult[]>([]);
    const [userNotes, setUserNotes] = useState<UserNotes[]>([])
    const [error, setError] = useState<string | null>(null);
    const [userID, setUserID] = useState<string | null>(null);
    const [libraryMessages, setLibraryMessages] = useState<Record<string, string>>({});
    const [activeTab, setActiveTab] = useState("tab1");

    // Fetch user ID
    useEffect(() => {
        const fetchUserID = async () => {
            try {
                const response = await fetch('flask-api/whoami', {
                    method: 'GET',
                    credentials: 'include',
                });
                const data = await response.json();
                if (data.message) {
                    setUserID(data.message);
                }
            } catch {
                console.error("Failed to fetch user ID");
            }
        };
        fetchUserID();
    }, []);

    // Fetch endnote and region name
    useEffect(() => {
        if (!selectedRegion) return;

        const fetchEndnote = async () => {
            try {
                const response = await fetch(
                    `flask-api/get_endnote?abbr=${encodeURIComponent(selectedRegion)}`
                );
                const data = await response.json();
                if (data.error) {
                    setError(data.error);
                    setRegionName(null);
                    setEndnote(null);
                    setPapers([]);
                } else {
                    setRegionName(data.names.join(", "));
                    setEndnote(data.endnotes.join("\n"));
                    setError(null);
                }
            } catch {
                setError("Failed to fetch region info.");
            }
        };

        fetchEndnote();
    }, [selectedRegion]);

    // Fetch papers with SerpAPI
    useEffect(() => {
        if (!selectedRegion || !userID) return;

        const fetchRegionPapers = async () => {
            try {
                const response = await fetch(
                    `/flask-api/region-papers-by-abbr/${encodeURIComponent(selectedRegion)}?user_id=${userID}`
                );
                const data = await response.json();
                if (data.error) {
                    setError(data.error);
                    setPapers([]);
                } else {
                    setPapers(data.papers || []);
                    setError(null);
                }
            } catch {
                setError("Failed to fetch region papers.");
            }
        };

        const fetchPublicUserNotes = async () => {
            try {
                const response = await fetch('/flask-api/find-public-notes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        region: selectedRegion,
                    }),
                    credentials: 'include'
                });
                const data = await response.json();
                if (data.error) {
                    // setError(data.error);
                    setUserNotes([]);
                } else {
                    console.log("here")
                    setUserNotes(data.message || []);
                    // setError(null);
                }
            } catch {
                setError("Failed to fetch public notes");
            }
        };

        fetchRegionPapers();
        fetchPublicUserNotes();
    }, [selectedRegion, userID]);

    const handleAddToLibrary = async (paper: PaperResult) => {
        if (!userID || !paper.title || !paper.link) {
            setLibraryMessages(prev => ({
                ...prev,
                [paper.reference]: "⚠️ Missing user or paper data."
            }));
            return;
        }

        try {
            const res = await fetch('/flask-api/library/add-region-paper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userID,
                    title: paper.title,
                    link: paper.link,
                    reference: paper.reference
                }),
                credentials: 'include'
            });

            const data = await res.json();
            if (res.ok) {
                setLibraryMessages(prev => ({
                    ...prev,
                    [paper.reference]: data.message
                }));
                // Update paper to show "already added"
                setPapers(prev =>
                    prev.map(p =>
                        p.reference === paper.reference ? { ...p, alreadyAdded: true } : p
                    )
                );
            } else {
                setLibraryMessages(prev => ({
                    ...prev,
                    [paper.reference]: `❌ ${data.error}`
                }));
            }
        } catch {
            setLibraryMessages(prev => ({
                ...prev,
                [paper.reference]: "⚠️ Server error while adding."
            }));
        }
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
            <p className="text-lg font-semibold pt-2">Selected Region Info</p>
            <p>Region Abbreviation: {selectedRegion}</p>
            <p>Region Name: {regionName || ""}</p>

            <p className="font-semibold mt-4">Swanson Notes:</p>
            <div className="pl-2">
            <p>
                {endnote ? (() => {
                    const words = endnote.split(" ");
                    return words.length > 15 ? words.slice(0, 10).join(" ") + "..." : endnote; })() : "Select a Region"}
            </p>
            </div>

            <div className="flex border-b border-gray-500 text-center">
                <button
                    onClick={() => setActiveTab("tab1")}
                    className={`px-3 py-1 -mb-px font-semibold border-b-2 ${activeTab === "tab1" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"}`}>
                    Ref Papers
                </button>
                <button
                    onClick={() => setActiveTab("tab2")}
                    className={`px-3 py-1 -mb-px font-semibold border-b-2 ${activeTab === "tab2" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"}`}>
                    User Notes
                </button>
            </div>

            {/* <p className="font-semibold mt-4">Referenced Papers:</p> */}
            <div className="mt-1">
                {activeTab === "tab1" &&<div>
                    {papers.length > 0 ? (
                        papers.map((paper, idx) => (
                            <div key={idx} className="border border-black rounded bg-gray-100 mb-2 mr-1 max-h-64 overflow-y-auto">
                                <p className="font-semibold text-black">{paper.reference}</p>
                                {paper.title && paper.link ? (
                                    <a
                                        href={paper.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline"
                                    >
                                        {(() => {
                                                const words = paper.title.split(" ");
                                                return words.length > 10 ? words.slice(0, 5).join(" ") + "..." : paper.title; })()}
                                    </a>
                                ) : (
                                    <p className="italic text-black">No paper found</p>
                                )}
                                {paper.snippet && (
                                    <p className="text-sm text-black-100">{paper.snippet.split(" ").slice(0,25).join(" ")}</p>
                                )}
                                {paper.error && (
                                    <p className="text-red-500">{paper.error}</p>
                                )}
                                {paper.title && paper.link && (
                                    <>
                                        {paper.alreadyAdded ? (
                                            <p className="text-green-600 text-sm mt-1">✅ Already in Library</p>
                                        ) : (
                                            <button
                                                onClick={() => handleAddToLibrary(paper)}
                                                className="mt-1 px-3 py-1 text-sm bg-green-600 text-white rounded"
                                            >
                                                Add to Library
                                            </button>
                                        )}
                                        {libraryMessages[paper.reference] && (
                                            <p className="text-sm text-blue-500 mt-1">
                                                {libraryMessages[paper.reference]}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        ))
                    ) : (
                        <p>Select a Region</p>
                    )}
                </div>}
                {activeTab === "tab2" && <div>
                    {userNotes.length > 0 ? (
                        userNotes.map((note, idx) => (
                            <div key={idx} className="border border-black rounded bg-gray-100 mb-2 mr-1 max-h-48 overflow-y-auto">
                                <p className="font-semibold text-black pl-1">Title: {note.title}</p>
                                <p className="font-semibold text-black pl-1">Author: {note.author}</p>
                                <div>
                                    <p className="font-semibold text-black pl-1">Content:</p>
                                    <p className="font-semibold text-gray-600 pl-3">{note.content}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No Public User Notes for Region</p>
                    )}
                </div>}
            </div>

            {error && <p className="text-red-600 mt-4">Error: {error}</p>}
        </div>
    );
};

export default RegionInfo;


