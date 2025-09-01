'use client';

import { useState, useEffect, SetStateAction, Dispatch } from "react";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getElement } from "openseadragon";

type adminSideInfo = {
    adminFunc: string | null
    user:      string | null
    setAdminFunc: Dispatch<SetStateAction<string>>
}

const AdminSide: React.FC<adminSideInfo> = ({adminFunc, user, setAdminFunc}) => {

    const router = useRouter();
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
  return (
    <aside className="w-56 app_main_color fixed top-0 left-0 z-30 h-screen transition-transform -translate-x-full sm:translate-x-0" aria-label="Sidebar">
        <div className="h-full px-3 py-4 overflow-y-auto app_main_color dark:bg-gray-800">
            <ul className="space-y-2 text-lg font-bold">
                <li className="text-white">
                    {user == "Not Signed In" || user == null? "Please Signin": "Welcome "+ user}
                </li>
            </ul>
            <ul className="pt-4 mt-4 space-y-2 font-medium border-t border-gray-200 dark:border-gray-700">
                <h1 className="text-white">App Functionality</h1>
                <li>
                    <Link href="/" className="flex items-center p-2 text-white rounded-lg dark:text-white hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 group">
                        <svg className="w-6 h-6 text-white-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" 
                            aria-hidden="true" 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="currentColor" 
                            viewBox="0 0 16 16">
                            <path d="M1 6V15H6V11C6 9.89543 6.89543 9 8 9C9.10457 9 10 9.89543 10 11V15H15V6L8 0L1 6Z" />
                        </svg>
                        <span className="ms-3">Main Dashboard</span>
                    </Link>
                </li>
                <li>
                    <a href="/atlas" className="flex items-center p-2 text-white rounded-lg dark:text-white hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 group">
                        <svg 
                            className="w-6 h-6 text-white-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" 
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
                        <span className="ms-3">View Atlas</span>
                    </a>
                </li>
                <li>
                    <Link href="/library" className="flex items-center p-2 text-white rounded-lg dark:text-white hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 group">
                        <svg className="shrink-0 w-6 h-6 text-white-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.425 13.953c0 0 24.137 0 24.173 0 0.583-0.255 0.557-0.802 0.011-1.165-0.547-0.365-12.119-8.718-12.119-8.718s-11.482 8.353-12.065 8.718c-0.582 0.363-0.619 0.91 0 1.165zM15.49 8.195c0.965 0 1.748 0.782 1.748 1.747s-0.783 1.748-1.748 1.748-1.747-0.783-1.747-1.748 0.782-1.747 1.747-1.747zM4.027 26.932h22.968v-0.977h-22.968v0.977zM9 24.936v-8.903h0.978v-1.103h-4.993v1.003h0.978v9.002h3.037zM17.030 24.936v-8.966h0.978v-0.978h-4.992v0.94h0.977v9.002h3.037zM3.030 28.93h24.963v-0.914h-24.963v0.914zM24.998 24.936v-8.966h0.978v-0.978h-4.993v0.94h0.979v9.002h3.036z"></path>
                        </svg>
                        <span className="flex-1 ms-3 whitespace-nowrap">My Library</span>
                    </Link>
                </li>
                <li>
                    {/* Should redirect to notes not collection, only change here. */}
                    <Link href="/notes" className="flex items-center p-2 text-white rounded-lg dark:text-white hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 group">
                        <svg className="shrink-0 w-5 h-5 text-white-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3V5M12 3V5M15 3V5M13 9H9M15 13H9M8.2 21H15.8C16.9201 21 17.4802 21 17.908 20.782C18.2843 20.5903 18.5903 20.2843 18.782 19.908C19 19.4802 19 18.9201 19 17.8V7.2C19 6.0799 19 5.51984 18.782 5.09202C18.5903 4.71569 18.2843 4.40973 17.908 4.21799C17.4802 4 16.9201 4 15.8 4H8.2C7.0799 4 6.51984 4 6.09202 4.21799C5.71569 4.40973 5.40973 4.71569 5.21799 5.09202C5 5.51984 5 6.07989 5 7.2V17.8C5 18.9201 5 19.4802 5.21799 19.908C5.40973 20.2843 5.71569 20.5903 6.09202 20.782C6.51984 21 7.07989 21 8.2 21Z" />
                        </svg>
                        <span className="flex-1 ms-3 whitespace-nowrap">My Notes</span>
                    </Link>
                </li>
                <li>
                    <button onClick={logOut} className="flex items-center w-full text-start p-2 text-white rounded-lg dark:text-white hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 group">
                        <svg className="shrink-0 w-5 h-5 text-white-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 21 21">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H15M8 8L4 12M4 12L8 16M4 12L16 12"/>
                        </svg>
                        <span className="flex-1 ms-3 whitespace-nowrap">Logout</span>
                    </button>
                </li>
            </ul>
            <ul className="pt-4 mt-4 space-y-2 font-medium border-t border-gray-200 dark:border-gray-700">
                <h1 className="text-white">Admin Functionality</h1>
                <li>
                    <button onClick={() => setAdminFunc("users")} id="users" className="flex items-center w-full p-2 text-white hover:text-black rounded-lg hover:bg-gray-100 group">
                    <svg className="shrink-0 w-5 h-5 text-white transition duration-75 group-hover:text-black" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
                        <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z"/>
                    </svg>
                    <span className="ms-3 whitespace-nowrap">Manage Users</span>
                    </button>
                </li>
                <li>
                    <button onClick={() => setAdminFunc("notes")} id="notes" className="flex items-center w-full p-2 text-white hover:text-black rounded-lg hover:bg-gray-100 group">
                    <svg className="shrink-0 w-5 h-5 text-white transition duration-75 group-hover:text-gray-900" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.96 2.96 0 0 0 .13 5H5Z"/>
                        <path d="M6.737 11.061a2.961 2.961 0 0 1 .81-1.515l6.117-6.116A4.839 4.839 0 0 1 16 2.141V2a1.97 1.97 0 0 0-1.933-2H7v5a2 2 0 0 1-2 2H0v11a1.969 1.969 0 0 0 1.933 2h12.134A1.97 1.97 0 0 0 16 18v-3.093l-1.546 1.546c-.413.413-.94.695-1.513.81l-3.4.679a2.947 2.947 0 0 1-1.85-.227 2.96 2.96 0 0 1-1.635-3.257l.681-3.397Z"/>
                        <path d="M8.961 16a.93.93 0 0 0 .189-.019l3.4-.679a.961.961 0 0 0 .49-.263l6.118-6.117a2.884 2.884 0 0 0-4.079-4.078l-6.117 6.117a.96.96 0 0 0-.263.491l-.679 3.4A.961.961 0 0 0 8.961 16Zm7.477-9.8a.958.958 0 0 1 .68-.281.961.961 0 0 1 .682 1.644l-.315.315-1.36-1.36.313-.318Zm-5.911 5.911 4.236-4.236 1.359 1.359-4.236 4.237-1.7.339.341-1.699Z"/>
                    </svg>
                    <span className="ms-3 whitespace-nowrap">Manage Notes</span>
                    </button>
                </li>
            </ul>
        </div>
    </aside>
  );
}

export default AdminSide