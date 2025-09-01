'use client'

import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import "../app/globals.css"
import Link from "next/link";
import { stringify } from 'querystring';
import { stringifyResumeDataCache } from 'next/dist/server/resume-data-cache/resume-data-cache';

const SearchResults = () => {
    const router = useRouter();
    const { query, db } = router.query;  
    const [results, setResults] = useState<null | object>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<null | Error>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [userID, setUserID] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [libraryMessages, setLibraryMessages] = useState<Record<string, string>>({});


    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedDatabase, setSelectedDatabase] = useState("pubmed");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const formatDateForNCBI = (dateStr: string) => {
        return new Date(dateStr).toISOString().split('T')[0].replace(/-/g, '/');
    };

    const logOut = async (event: { preventDefault: () => void; }) => {
        event.preventDefault();
        try {
            const response = await fetch('flask-api/logout');
            const data = await response.json();
            if (response.ok) {
                console.log('Logout corret', data);
                router.push("/")
            } else {
                console.log(data.error)
            }
        } catch (error) {
            let errorMessage = "Failed to login"
            if (error instanceof Error) {
                errorMessage = error.message
            }
            console.error('Logout failed:', error);
        }
    };

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
                    setRole(data.role)
                }
            } catch {
                console.error("Failed to fetch user ID");
            }
        };
        fetchUserID();
    }, []);
    

    useEffect(() => {
        if (!query || !db) return;

        const fetchResults = async () => {
            setLoading(true);
            const baseUrl = "flask-api/search";
            const params = new URLSearchParams({
                query: query as string,
                db: db as string,
                page: currentPage.toString()
            });
            
            if (startDate) {
                params.append('start_date', formatDateForNCBI(startDate));
            }
            if (endDate) {
                params.append('end_date', formatDateForNCBI(endDate));
            }
            

            
            try {
                const response = await fetch(`${baseUrl}?${params.toString()}`);
                const data = await response.json();
                let fetchedResults = Object.entries(data.results?.result || {})
                .filter(([key, value]) => key !== 'uids' && typeof value === 'object' && 'title' in value)
                .map(([_, value]) => value);
                const alreadyAddedMessages: Record<string, string> = {};
                fetchedResults.forEach(article => {
                    if (article.alreadyAdded) {
                        alreadyAddedMessages[article.uid] = "✅ Already in Library";
                    }
                });
                setLibraryMessages(alreadyAddedMessages);
               
                setResults(fetchedResults);
                setTotalPages(data.pagination?.total_pages || 1);
                // Apply date filtering only if both startDate and endDate are provided
                if (startDate && endDate) {
                    const start = new Date(startDate);
                    let end = new Date(endDate);
                    end = new Date(end.setDate(end.getDate() + 1));

                    fetchedResults = fetchedResults.filter(item => {
                        const itemDate = new Date(item.sortpubdate || item.pubdate || "1000/01/01");
                        return itemDate >= start && itemDate < end;
                    }).sort((a, b) => new Date(a.sortpubdate || a.pubdate) - new Date(b.sortpubdate || b.pubdate));
                }

                setResults(fetchedResults);
                setLoading(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (error) {
                console.error(`Error fetching results from ${db}:`, error);
                if (error instanceof Error) {
                    setError(error);
                }
                setLoading(false);
            }
        };

        fetchResults();
    }, [query, db, startDate, endDate, currentPage]);

    const handleInputChange = (event) => {
        event.preventDefault();
        setSearchQuery(event.target.value)
        setSelectedDatabase(event.target.value)
    };

     // Rendering function for PubMed data
    const renderPubMedArticle = (article: { title?: any; authors?: any; fulljournalname?: any; uid?: any; epubdate?: any; pubdate?: any; sortpubdate?: any; }, index: React.Key | null | undefined) => {
        const { epubdate, pubdate, sortpubdate } = article;

        const hasDay = (date: string) => /\d{4}\/\d{2}\/\d{2}/.test(date);

        let displayDate = epubdate || pubdate; 

        if (!hasDay(displayDate)) {
            displayDate = hasDay(sortpubdate) ? formatDate(sortpubdate) : formatDate(pubdate);
        } else {
            displayDate = formatDate(displayDate);
        }

        return (
            <div className="col-span-1 flex flex-col p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100" key={index}>
                <h2 className="mb-2 text-2xl text-md font-bold text-gray-900">{article.title}</h2>
                <div>
                    <p><strong>Author(s):</strong> {article.authors ? article.authors.map((author: { name: any; }) => author.name).slice(0,2).join(', ') : 'No authors listed'}</p>
                    <p><strong>Journal Name:</strong> {article.fulljournalname}</p>
                    <p><strong>Date:</strong> {displayDate}</p>
                </div>
                <div className="flex flex-wrap mt-auto pt-3 text-s">
                    <a href={`https://www.ncbi.nlm.nih.gov/pubmed/${article.uid}`} target="_blank" rel="noopener noreferrer">
                        <p className="mr-2 mb-2 underline">Click to read the article</p>
                    </a>
                </div>
                {userID && (
                    <>
                        {libraryMessages[article.uid]?.includes("already") ? (
                            <p className="text-green-600 text-sm mt-1">✅ Already in Library</p>
                        ) : (
                            <button
                                onClick={() => handleAddToLibrary(article, 'pubmed')}
                                className="mt-1 px-3 py-1 text-sm bg-green-600 text-white rounded"
                            >
                                Add to Library
                            </button>
                        )}
                        {libraryMessages[article.uid] && (
                            <p className="text-sm text-blue-500 mt-1">
                                {libraryMessages[article.uid]}
                            </p>
                        )}
                    </>
                )}

            </div>
        );
    };
    
    const handleAddToLibrary = async (article: any, source: 'pubmed' | 'pmc') => {
        if (!userID || !article.title || !article.uid) {
            setLibraryMessages(prev => ({
                ...prev,
                [article.uid]: "⚠️ Missing user or article data."
            }));
            return;
        }
    
        const body = {
            user_id: userID,
            title: article.title,
            source,
            uid: article.uid,
            authors: article.authors?.map((a: any) => a.name) || [],
            journal: article.fulljournalname || '',
            year: article.pubdate || article.epubdate || article.sortpubdate || '',
            abstract: article.abstract || ''
        };
    
        try {
            const res = await fetch('/flask-api/library/add-pubmed-paper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                credentials: 'include'
            });
    
            const data = await res.json();
            setLibraryMessages(prev => ({
                ...prev,
                [article.uid]: data.message || '✅ Added to library'
            }));
        } catch (err) {
            setLibraryMessages(prev => ({
                ...prev,
                [article.uid]: 'Error adding to library'
            }));
        }
    };
    

    // Helper function to format dates as "YYYY MMM DD"
    const formatDate = (dateStr: string | number | Date) => {
        if (!dateStr) return 'No date available';
        const date = new Date(dateStr);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const limitPara = (words: string, wordLimit: number) => {
        if (words != undefined) {
            let wordArray = words.split(' ', -1)
            let sum: string[] = []
            for(let i = 0; i < wordLimit; i++) {
                sum.push(wordArray[i])
            }
            sum.push("....")
            return sum.join(" ")
        }
    }

    // Rendering function for Gene data
    const renderGeneData = (gene: { name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; uid: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; description: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; summary: string; otheraliases: any; mim: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }, index: React.Key | null | undefined) => (
        <div className="col-span-1 flex flex-col p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100" key={index}>
            <h2 className="mb-2 text-2xl text-md font-bold text-gray-900">{gene.name} (Gene ID: {gene.uid})</h2>
            <div>
                <p><strong>Description:</strong> {gene.description}</p>
                <p><strong>Summary:</strong> {limitPara(gene.summary, 50)}</p>
                <p><strong>Aliases:</strong> {gene.otheraliases || 'No aliases listed'}</p>
                <p><strong>MIM ID:</strong> {gene.mim}</p>
            </div>
            <div className="flex flex-wrap mt-auto pt-3 text-s">
                <a href={`https://www.ncbi.nlm.nih.gov/gene/${gene.uid}`} target="_blank" rel="noopener noreferrer">
                    <p className="mr-2 mb-2 underline">Click to read the article</p>
                </a>
            </div>
        </div>
    );

    // Rendering function for Nucleotide data
    const renderNucleotideData = (nucleotide: { title: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; caption: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; createdate: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; updatedate: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; uid: any; }, index: React.Key | null | undefined) => (
        <div className="col-span-1 flex flex-col p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100" key={index}>
            <h2 className="mb-2 text-2xl text-md font-bold text-gray-900">{nucleotide.title}</h2>
            <div>
                <p><strong>Caption:</strong> {nucleotide.caption}</p>
                <p><strong>Created:</strong> {nucleotide.createdate}</p>
                <p><strong>Updated:</strong> {nucleotide.updatedate}</p>
            </div>
            <div className="flex flex-wrap mt-auto pt-3 text-s">
                <a href={`https://www.ncbi.nlm.nih.gov/nuccore/${nucleotide.uid}`} target="_blank" rel="noopener noreferrer">
                    <p className="mr-2 mb-2 underline">Click to read the article</p>
                </a>
            </div>
        </div>
    );

    // Rendering function for Protein data
    const renderProteinData = (protein: { title: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; createdate: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; updatedate: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; accessionversion: any; }, index: React.Key | null | undefined) => (
        <div className="col-span-1 flex flex-col p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100" key={index}>
            <h2 className="mb-2 text-2xl text-md font-bold text-gray-900">{protein.title}</h2>
            <div>
                <p><strong>Created:</strong> {protein.createdate}</p>
                <p><strong>Updated:</strong> {protein.updatedate}</p>
            </div>
            <div className="flex flex-wrap mt-auto pt-3 text-s">
                <a href={`https://www.ncbi.nlm.nih.gov/protein/${protein.accessionversion}`} target="_blank" rel="noopener noreferrer">
                    <p className="mr-2 mb-2 underline">Click to read the article</p>
                </a>
            </div>
        </div>
    );
    // Rendering function for PMC data
    const renderPMCData = (article: { articleids: any[]; pubdate: any; title: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; uid: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; fulljournalname: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; authors: any[]; }, index: React.Key | null | undefined) => {
        const pmcIdObj = article.articleids?.find((id: { idtype: string; }) => id.idtype === 'pmcid');
        const pmcId = pmcIdObj ? pmcIdObj.value : 'No PMC ID found';
        const formattedDate = formatDate(article.pubdate);

        return (
            <div className="col-span-1 flex flex-col p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100" key={index}>
                <h2 className="mb-2 text-2xl text-md font-bold text-gray-900">{article.title} (UID: {article.uid})</h2>
                <div>
                    <p><strong>Date:</strong> {formattedDate}</p>
                    <p><strong>Journal Name:</strong> {article.fulljournalname}</p>
                    <p><strong>Author(s):</strong> {article.authors?.map((author: { name: any; }) => author.name).slice(0,2).join(', ') || 'No authors listed'}</p>
                    <p><strong>PMC ID:</strong> {pmcId}</p>
                </div>
                <div className="flex flex-wrap mt-auto pt-3 text-s">
                    <a href={`https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcId}/`} target="_blank" rel="noopener noreferrer">
                        <p className="mr-2 mb-2 underline">Click to read the article</p>
                    </a>
                </div>
                {userID && (
                <>
                    {libraryMessages[article.uid]?.includes("already") ? (
                        <p className="text-green-600 text-sm mt-1">✅ Already in Library</p>
                    ) : (
                        <button
                            onClick={() => handleAddToLibrary(article, 'pmc')}
                            className="mt-1 px-3 py-1 text-sm bg-green-600 text-white rounded"
                        >
                            Add to Library
                        </button>
                    )}
                    {libraryMessages[article.uid] && (
                        <p className="text-sm text-blue-500 mt-1">
                            {libraryMessages[article.uid]}
                        </p>
                    )}
                </>
            )}

            </div>
        );
    };

    
    return (
        <div className='h-screen bg-gray-100'>

            <aside id="default-sidebar" className="fixed top-0 left-0 z-30 w-56 h-screen transition-transform -translate-x-full sm:translate-x-0" aria-label="Sidebar">
                <div className="app_main_color h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                    <ul className="space-y-2 text-lg font-bold">
                        <li className="text-white">
                            {userID == "Not Signed In" || userID == null? "Sign in for all features": "Welcome "+ userID}
                        </li>
                    </ul>
                    <ul className="pt-4 mt-4 space-y-2 font-medium border-t border-gray-200 dark:border-gray-700">
                        <li>
                            <Link href="/" className="flex items-center p-2 text-white hover:text-black rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                                <svg className="w-6 h-6 text-white transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" 
                                    aria-hidden="true" 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    fill="currentColor" 
                                    viewBox="0 0 16 16">
                                    <path d="M1 6V15H6V11C6 9.89543 6.89543 9 8 9C9.10457 9 10 9.89543 10 11V15H15V6L8 0L1 6Z" />
                                </svg>
                                <span className="ms-3">Back to Dashboard</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/atlas" className="flex items-center p-2 text-white hover:text-black rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                                <svg 
                                    className="w-6 h-6 text-white transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" 
                                    aria-hidden="true" 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    fill="currentColor"
                                    viewBox="0 0 64 64" 
                                    preserveAspectRatio="xMidYMid meet">
                                    <path d="M63,26c0-3.433-2.007-6.561-5.05-8.06C57.982,17.631,58,17.318,58,17c0-4.963-4.038-9-9-9   c-0.076,0-0.151,0.013-0.228,0.015C47.865,4.005,44.28,1,40,1c-3.483,0-6.505,1.993-8,4.896C30.505,2.993,27.483,1,24,1   c-4.248,0-7.862,2.955-8.775,7.011C15.15,8.01,15.076,8,15,8c-4.962,0-9,4.037-9,9c0,0.305,0.016,0.613,0.049,0.922   C2.999,19.42,1,22.57,1,26c0,2.303,0.877,4.4,2.305,5.993C1.832,33.635,1,35.771,1,38c0,3.432,2.007,6.561,5.05,8.06   C6.018,46.369,6,46.682,6,47c0,4.963,4.038,9,9,9c0.076,0,0.15-0.01,0.225-0.011C16.138,60.045,19.752,63,24,63   c3.483,0,6.505-1.993,8-4.896C33.495,61.007,36.517,63,40,63c4.28,0,7.865-3.005,8.772-7.015C48.849,55.987,48.924,56,49,56   c4.962,0,9-4.037,9-9c0-0.305-0.017-0.612-0.049-0.922C61.001,44.581,63,41.43,63,38c0-2.303-0.877-4.4-2.305-5.993   C62.168,30.365,63,28.229,63,26z M56.493,44.533l-0.785,0.3l0.16,0.825C55.956,46.11,56,46.562,56,47c0,3.859-3.14,7-7,7   c0-4.963-4.038-9-9-9v2c3.86,0,7,3.141,7,7s-3.14,7-7,7s-7-3.141-7-7V16h-2v38c0,3.859-3.14,7-7,7   c-3.247,0-6.013-2.219-6.783-5.288C21.109,54.721,24,51.196,24,47h-2c0,3.859-3.14,7-7,7s-7-3.141-7-7s3.14-7,7-7v-2   c-3.932,0-7.275,2.539-8.497,6.06C4.372,42.824,3,40.51,3,38c0-1.734,0.647-3.395,1.793-4.673C6.265,34.376,8.059,35,10,35v-2   c-3.86,0-7-3.141-7-7c0-2.878,1.812-5.504,4.507-6.533l0.786-0.301l-0.161-0.825C8.044,17.892,8,17.44,8,17c0-3.859,3.14-7,7-7   s7,3.141,7,7h2c0-4.196-2.891-7.721-6.783-8.712C17.987,5.219,20.753,3,24,3c3.86,0,7,3.141,7,7v4h2v-4c0-3.859,3.14-7,7-7   s7,3.141,7,7s-3.14,7-7,7v2c4.962,0,9-4.037,9-9c3.86,0,7,3.141,7,7s-3.14,7-7,7v2c3.932,0,7.275-2.539,8.497-6.061   C59.628,21.175,61,23.49,61,26c0,1.734-0.647,3.395-1.793,4.673C57.735,29.624,55.941,29,54,29c-4.962,0-9,4.037-9,9h2   c0-3.859,3.14-7,7-7s7,3.141,7,7C61,40.878,59.188,43.504,56.493,44.533z"/>
                                    <path d="M43,10h2c0-2.757-2.243-5-5-5v2C41.654,7,43,8.346,43,10z"/>
                                    <path d="M37,54h-2c0,2.757,2.243,5,5,5v-2C38.346,57,37,55.654,37,54z"/>
                                    <path d="M54,41v2c2.757,0,5-2.243,5-5h-2C57,39.654,55.654,41,54,41z"/>
                                    <path d="M39,37h-2c0,3.309,2.691,6,6,6v-2C40.794,41,39,39.206,39,37z"/>
                                    <path d="M41,23v-2c-3.309,0-6,2.691-6,6h2C37,24.794,38.794,23,41,23z"/>
                                    <path d="M25,37h-2c0,3.309,2.691,6,6,6v-2C26.794,41,25,39.206,25,37z"/>
                                    <path d="M40,28h-2c0,3.309,2.691,6,6,6v-2C41.794,32,40,30.206,40,28z"/>
                                    <path d="M27,23v-2c-3.309,0-6,2.691-6,6h2C23,24.794,24.794,23,27,23z"/>
                                    <path d="M14,36h2c0-2.206,1.794-4,4-4v-2C16.691,30,14,32.691,14,36z"/>
                                    <path d="M15,50v2c2.757,0,5-2.243,5-5h-2C18,48.654,16.654,50,15,50z"/>
                                    <path d="M5,26h2c0-1.654,1.346-3,3-3v-2C7.243,21,5,23.243,5,26z"/>
                                    <path d="M15,12v2c1.654,0,3,1.346,3,3h2C20,14.243,17.757,12,15,12z"/>
                                    <path d="M24,5v2c1.654,0,3,1.346,3,3h2C29,7.243,26.757,5,24,5z"/>
                                </svg>
                                <span className="ms-3">Atlas</span>
                            </Link>
                        </li>
                        {role == "user" && (
                            <>
                                <li>
                                <Link href="/library" className="flex items-center p-2 text-white rounded-lg dark:text-white hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 group">
                                    <svg className="shrink-0 w-6 h-6 text-white-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.425 13.953c0 0 24.137 0 24.173 0 0.583-0.255 0.557-0.802 0.011-1.165-0.547-0.365-12.119-8.718-12.119-8.718s-11.482 8.353-12.065 8.718c-0.582 0.363-0.619 0.91 0 1.165zM15.49 8.195c0.965 0 1.748 0.782 1.748 1.747s-0.783 1.748-1.748 1.748-1.747-0.783-1.747-1.748 0.782-1.747 1.747-1.747zM4.027 26.932h22.968v-0.977h-22.968v0.977zM9 24.936v-8.903h0.978v-1.103h-4.993v1.003h0.978v9.002h3.037zM17.030 24.936v-8.966h0.978v-0.978h-4.992v0.94h0.977v9.002h3.037zM3.030 28.93h24.963v-0.914h-24.963v0.914zM24.998 24.936v-8.966h0.978v-0.978h-4.993v0.94h0.979v9.002h3.036z"></path>
                                    </svg>
                                    <span className="flex-1 ms-3 whitespace-nowrap">My Library</span>
                                </Link>
                                </li>
                                <li>
                                <Link href="/search-results" className="flex items-center p-2 text-white rounded-lg dark:text-white hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 group">
                                    <svg className="shrink-0 w-6 h-6 text-white-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 26 26">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" fillRule="evenodd" clipRule="evenodd" d="M9.29289 1.29289C9.48043 1.10536 9.73478 1 10 1H18C19.6569 1 21 2.34315 21 4V8C21 8.55228 20.5523 9 20 9C19.4477 9 19 8.55228 19 8V4C19 3.44772 18.5523 3 18 3H11V8C11 8.55228 10.5523 9 10 9H5V20C5 20.5523 5.44772 21 6 21H10C10.5523 21 11 21.4477 11 22C11 22.5523 10.5523 23 10 23H6C4.34315 23 3 21.6569 3 20V8C3 7.73478 3.10536 7.48043 3.29289 7.29289L9.29289 1.29289ZM6.41421 7H9V4.41421L6.41421 7ZM20.1716 18.7574C20.6951 17.967 21 17.0191 21 16C21 13.2386 18.7614 11 16 11C13.2386 11 11 13.2386 11 16C11 18.7614 13.2386 21 16 21C17.0191 21 17.967 20.6951 18.7574 20.1716L21.2929 22.7071C21.6834 23.0976 22.3166 23.0976 22.7071 22.7071C23.0976 22.3166 23.0976 21.6834 22.7071 21.2929L20.1716 18.7574ZM13 16C13 14.3431 14.3431 13 16 13C17.6569 13 19 14.3431 19 16C19 17.6569 17.6569 19 16 19C14.3431 19 13 17.6569 13 16Z"/>
                                    </svg>
                                    <span className="flex-1 ms-3 whitespace-nowrap">Paper Search</span>
                                </Link>
                                </li>
                                <li>
                                    <Link href="/notes" className="flex items-center p-2 text-white rounded-lg dark:text-white hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 group">
                                        <svg className="shrink-0 w-5 h-5 text-white-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 22 22">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3V5M12 3V5M15 3V5M13 9H9M15 13H9M8.2 21H15.8C16.9201 21 17.4802 21 17.908 20.782C18.2843 20.5903 18.5903 20.2843 18.782 19.908C19 19.4802 19 18.9201 19 17.8V7.2C19 6.0799 19 5.51984 18.782 5.09202C18.5903 4.71569 18.2843 4.40973 17.908 4.21799C17.4802 4 16.9201 4 15.8 4H8.2C7.0799 4 6.51984 4 6.09202 4.21799C5.71569 4.40973 5.40973 4.71569 5.21799 5.09202C5 5.51984 5 6.07989 5 7.2V17.8C5 18.9201 5 19.4802 5.21799 19.908C5.40973 20.2843 5.71569 20.5903 6.09202 20.782C6.51984 21 7.07989 21 8.2 21Z" />
                                        </svg>
                                        <span className="flex-1 ms-3 whitespace-nowrap">My Notes</span>
                                    </Link>
                                </li>
                            </>
                        )}
                        {role == "admin" && (
                            <>
                                <li>
                                <Link href="/library" className="flex items-center p-2 text-white rounded-lg dark:text-white hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 group">
                                    <svg className="shrink-0 w-6 h-6 text-white-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 28 28">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.425 13.953c0 0 24.137 0 24.173 0 0.583-0.255 0.557-0.802 0.011-1.165-0.547-0.365-12.119-8.718-12.119-8.718s-11.482 8.353-12.065 8.718c-0.582 0.363-0.619 0.91 0 1.165zM15.49 8.195c0.965 0 1.748 0.782 1.748 1.747s-0.783 1.748-1.748 1.748-1.747-0.783-1.747-1.748 0.782-1.747 1.747-1.747zM4.027 26.932h22.968v-0.977h-22.968v0.977zM9 24.936v-8.903h0.978v-1.103h-4.993v1.003h0.978v9.002h3.037zM17.030 24.936v-8.966h0.978v-0.978h-4.992v0.94h0.977v9.002h3.037zM3.030 28.93h24.963v-0.914h-24.963v0.914zM24.998 24.936v-8.966h0.978v-0.978h-4.993v0.94h0.979v9.002h3.036z"></path>
                                    </svg>
                                    <span className="flex-1 ms-3 whitespace-nowrap">My Library</span>
                                </Link>
                                </li>
                                <li>
                                <Link href="/search-results" className="flex items-center p-2 text-white rounded-lg dark:text-white hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 group">
                                    <svg className="shrink-0 w-6 h-6 text-white-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 26 26">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" fillRule="evenodd" clipRule="evenodd" d="M9.29289 1.29289C9.48043 1.10536 9.73478 1 10 1H18C19.6569 1 21 2.34315 21 4V8C21 8.55228 20.5523 9 20 9C19.4477 9 19 8.55228 19 8V4C19 3.44772 18.5523 3 18 3H11V8C11 8.55228 10.5523 9 10 9H5V20C5 20.5523 5.44772 21 6 21H10C10.5523 21 11 21.4477 11 22C11 22.5523 10.5523 23 10 23H6C4.34315 23 3 21.6569 3 20V8C3 7.73478 3.10536 7.48043 3.29289 7.29289L9.29289 1.29289ZM6.41421 7H9V4.41421L6.41421 7ZM20.1716 18.7574C20.6951 17.967 21 17.0191 21 16C21 13.2386 18.7614 11 16 11C13.2386 11 11 13.2386 11 16C11 18.7614 13.2386 21 16 21C17.0191 21 17.967 20.6951 18.7574 20.1716L21.2929 22.7071C21.6834 23.0976 22.3166 23.0976 22.7071 22.7071C23.0976 22.3166 23.0976 21.6834 22.7071 21.2929L20.1716 18.7574ZM13 16C13 14.3431 14.3431 13 16 13C17.6569 13 19 14.3431 19 16C19 17.6569 17.6569 19 16 19C14.3431 19 13 17.6569 13 16Z"/>
                                    </svg>
                                    <span className="flex-1 ms-3 whitespace-nowrap">Paper Search</span>
                                </Link>
                                </li>
                                <li>
                                    <Link href="/notes" className="flex items-center p-2 text-white rounded-lg dark:text-white hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 group">
                                        <svg className="shrink-0 w-5 h-5 text-white-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 22 22">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3V5M12 3V5M15 3V5M13 9H9M15 13H9M8.2 21H15.8C16.9201 21 17.4802 21 17.908 20.782C18.2843 20.5903 18.5903 20.2843 18.782 19.908C19 19.4802 19 18.9201 19 17.8V7.2C19 6.0799 19 5.51984 18.782 5.09202C18.5903 4.71569 18.2843 4.40973 17.908 4.21799C17.4802 4 16.9201 4 15.8 4H8.2C7.0799 4 6.51984 4 6.09202 4.21799C5.71569 4.40973 5.40973 4.71569 5.21799 5.09202C5 5.51984 5 6.07989 5 7.2V17.8C5 18.9201 5 19.4802 5.21799 19.908C5.40973 20.2843 5.71569 20.5903 6.09202 20.782C6.51984 21 7.07989 21 8.2 21Z" />
                                        </svg>
                                        <span className="flex-1 ms-3 whitespace-nowrap">My Notes</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/admin" className="flex items-center p-2 text-white rounded-lg dark:text-white hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 group">
                                        <svg className="shrink-0 w-5 h-5 text-white-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 -0.5 20 20">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M9.918 10.0005H7.082C6.66587 9.99708 6.26541 10.1591 5.96873 10.4509C5.67204 10.7427 5.50343 11.1404 5.5 11.5565V17.4455C5.5077 18.3117 6.21584 19.0078 7.082 19.0005H9.918C10.3341 19.004 10.7346 18.842 11.0313 18.5502C11.328 18.2584 11.4966 17.8607 11.5 17.4445V11.5565C11.4966 11.1404 11.328 10.7427 11.0313 10.4509C10.7346 10.1591 10.3341 9.99708 9.918 10.0005Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path fillRule="evenodd" clipRule="evenodd" d="M9.918 4.0006H7.082C6.23326 3.97706 5.52559 4.64492 5.5 5.4936V6.5076C5.52559 7.35629 6.23326 8.02415 7.082 8.0006H9.918C10.7667 8.02415 11.4744 7.35629 11.5 6.5076V5.4936C11.4744 4.64492 10.7667 3.97706 9.918 4.0006Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path fillRule="evenodd" clipRule="evenodd" d="M15.082 13.0007H17.917C18.3333 13.0044 18.734 12.8425 19.0309 12.5507C19.3278 12.2588 19.4966 11.861 19.5 11.4447V5.55666C19.4966 5.14054 19.328 4.74282 19.0313 4.45101C18.7346 4.1592 18.3341 3.9972 17.918 4.00066H15.082C14.6659 3.9972 14.2654 4.1592 13.9687 4.45101C13.672 4.74282 13.5034 5.14054 13.5 5.55666V11.4447C13.5034 11.8608 13.672 12.2585 13.9687 12.5503C14.2654 12.8421 14.6659 13.0041 15.082 13.0007Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path fillRule="evenodd" clipRule="evenodd" d="M15.082 19.0006H17.917C18.7661 19.0247 19.4744 18.3567 19.5 17.5076V16.4936C19.4744 15.6449 18.7667 14.9771 17.918 15.0006H15.082C14.2333 14.9771 13.5256 15.6449 13.5 16.4936V17.5066C13.525 18.3557 14.2329 19.0241 15.082 19.0006Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>                                
                                        </svg>
                                        <span className="flex-1 ms-3 whitespace-nowrap">Admin Dash</span>
                                    </Link>
                                </li>
                            </>
                        )}
                        </ul>
                        <ul className="pt-4 mt-4 space-y-2 font-medium border-t border-gray-200 dark:border-gray-700">
                        <li>
                            <div className='font-bold text-xl text-white pb-2'>
                                Search
                            </div>
                            <div>
                                <form
                                    id="searchForm"
                                    className="w-full max-w-full"
                                    onSubmit={(e) => {
                                    e.preventDefault();
                                    router.push({
                                        pathname: "/search-results",
                                        query: {
                                        query: searchQuery,
                                        db: selectedDatabase
                                        }
                                    });
                                    }}
                                >
                                    <div className = "flex items-center">
                                        <input
                                            type="text"
                                            name="query"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search..."
                                            className="w-full px-2 py-1 border border-gray-300 rounded-l-md focus:outline-none text-sm"
                                        />
                                        <button type="submit" className="bg-gray-300 text-primary px-3 py-2 rounded-r-md">
                                            <svg className="w-3 h-3 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                                            </svg>
                                        </button>
                                    </div>
                                    
                                    <select
                                        name="db"
                                        value={selectedDatabase}
                                        onChange={(e) => setSelectedDatabase(e.target.value)}
                                        className="block mt-2 rounded-md bg-gray-100 px-2 py-1 text-sm text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-200 w-full"
                                      >
                                        <option value="pubmed">PubMed</option>
                                        <option value="pmc">PubMed Central</option>
                                        <option value="gene">Gene</option>
                                        <option value="nuccore">Nucleotide</option>
                                        <option value="protein">Protein</option>
                                    </select>
                                </form>
                            </div>
                        </li>
                        <li>
                            <div className='font-bold text-xl text-white'>
                                Filters
                            </div>
                            <div>
                                <label htmlFor="startDate" className='text-white'>
                                    Start Date</label>
                            </div>
                            <input
                                type="date"
                                id="startDate" 
                                className='border'
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                            <div>
                                <label htmlFor="endDate" className='text-white'>End Date</label>
                            </div>
                            <input
                                type="date"
                                id="endDate"
                                className='border'
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </li>
                    </ul>
                    <ul className="pt-4 mt-4 space-y-2 font-medium border-t border-gray-200 dark:border-gray-700">
                        {role == "not user" && (
                            <><li>
                                <Link href="/login" className="flex items-center p-2 text-white hover:text-black rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                                    <svg className="shrink-0 w-5 h-5 text-white transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 16">
                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 8h11m0 0L8 4m4 4-4 4m4-11h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3" />
                                    </svg>
                                    <span className="flex-1 ms-3 whitespace-nowrap">Sign In</span>
                                </Link>
                            </li><li>
                                    <Link href="/register" className="flex items-center p-2 text-white hover:text-black rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                                        <svg className="shrink-0 w-5 h-5 text-whtie transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.96 2.96 0 0 0 .13 5H5Z" />
                                            <path d="M6.737 11.061a2.961 2.961 0 0 1 .81-1.515l6.117-6.116A4.839 4.839 0 0 1 16 2.141V2a1.97 1.97 0 0 0-1.933-2H7v5a2 2 0 0 1-2 2H0v11a1.969 1.969 0 0 0 1.933 2h12.134A1.97 1.97 0 0 0 16 18v-3.093l-1.546 1.546c-.413.413-.94.695-1.513.81l-3.4.679a2.947 2.947 0 0 1-1.85-.227 2.96 2.96 0 0 1-1.635-3.257l.681-3.397Z" />
                                            <path d="M8.961 16a.93.93 0 0 0 .189-.019l3.4-.679a.961.961 0 0 0 .49-.263l6.118-6.117a2.884 2.884 0 0 0-4.079-4.078l-6.117 6.117a.96.96 0 0 0-.263.491l-.679 3.4A.961.961 0 0 0 8.961 16Zm7.477-9.8a.958.958 0 0 1 .68-.281.961.961 0 0 1 .682 1.644l-.315.315-1.36-1.36.313-.318Zm-5.911 5.911 4.236-4.236 1.359 1.359-4.236 4.237-1.7.339.341-1.699Z" />
                                        </svg>
                                        <span className="flex-1 ms-3 whitespace-nowrap">Sign Up</span>
                                    </Link>
                                </li></>
                        )}
                        {role == "user" && (
                            <li>
                                <button onClick={logOut} className="flex items-center w-full text-start p-2 text-white rounded-lg dark:text-white hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 group">
                                    <svg className="shrink-0 w-5 h-5 text-white-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 21 21">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H15M8 8L4 12M4 12L8 16M4 12L16 12"/>
                                    </svg>
                                    <span className="flex-1 ms-3 whitespace-nowrap">Logout</span>
                                </button>
                            </li>
                        )}
                        {role == "admin" && (
                            <li>
                                <button onClick={logOut} className="flex items-center w-full text-start p-2 text-white rounded-lg dark:text-white hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 group">
                                    <svg className="shrink-0 w-5 h-5 text-white-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 21 21">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H15M8 8L4 12M4 12L8 16M4 12L16 12"/>
                                    </svg>
                                    <span className="flex-1 ms-3 whitespace-nowrap">Logout</span>
                                </button>
                            </li>
                        )}
                    </ul>
                </div>
            </aside>

            <div className='p-2 h-screen overflow-y-scroll sm:ml-56 bg-gray-700'>
                <h1 className='font-bold text-5xl m-2 text-white'>Search Results for: {query}</h1>
                {loading && <p className='ml-2'>Loading...</p>}
                {error && <p>An error occurred: {error.message}</p>}
                <div>
                    {results.length > 0 ? (
                        <div className='container mx-auto p-4 grid grid-cols-3 gap-3'>
                            {results.map((result: any, index: any) => {
                                if (db === 'pubmed') return renderPubMedArticle(result, index);
                                if (db === 'gene') return renderGeneData(result, index);
                                if (db === 'nuccore') return renderNucleotideData(result, index);
                                if (db === 'protein') return renderProteinData(result, index);
                                if (db === 'pmc') return renderPMCData(result, index);
                                return null; 
                            })}
                        </div>
                    ) : (
                        <p className='text-white'>Search Something</p>
                    )}
                </div>
                {/* Pagination Controls */}
                <div className="flex justify-center mt-6 space-x-4">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 font-semibold">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                 </div>
            </div>
        </div>
    );
};

export default SearchResults;

