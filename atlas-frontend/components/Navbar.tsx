'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Navbar = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDatabase, setSelectedDatabase] = useState("pubmed"); // Default to PubMed

    const [whoami, setWhoAmI] = useState<string | null>(null)
    
    // useEffect(() => {
    //     const pullWhoAmI = async () => {
    //         try {
    //             const response = await fetch(`flask-api/whoami`)
    //             const data = await response.json()

    //             if (data.error) {
    //                 console.error("Something bad")
    //             } else {
    //                 console.log(data)
    //                 setWhoAmI(data.message)
    //             }
    //         } catch (err) {
    //             console.error("didn't even get data")
    //         }
    //     };
    //     pullWhoAmI()
    // }, [ ])

    return (
        <header className="px-5 py-3 bg-primary shadow-sm font-work-sans">
            <nav className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center">
                    <Link href="/" passHref>
                        <Image src="/logo.png" alt="Logo" width={200} height={50} priority />
                    </Link>
                    <div className='text-gray-400 text-xl'>
                        {whoami == "Not Signed In" || whoami == null ?"Please login to use the Atlas to it's full potential": "Hello "+whoami}
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;