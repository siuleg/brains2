'use client';

import { useState } from "react";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [showAlertError, setShowAlertError] = useState(false)
    const [showAlertSuc, setShowAlertSuc] = useState(false)
    const [alertMessage, setAlertMessage] = useState<string | null>(null)
  
    const [formData, setFormData] = useState({
            email: '',
            password: ''
        });
    
        const handleChange = (event: { target: { name: any; value: any; }; }) => {
            const { name, value } = event.target;
            setFormData({
                ...formData,
                [name]: value
            });
        };
    
        const handleSubmit = async (event: { preventDefault: () => void; }) => {
            setAlertMessage(null)
            setShowAlertError(false)
            setShowAlertSuc(false)
            event.preventDefault();
            try {
                const response = await fetch('flask-api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                const data = await response.json();
                if (response.ok) {
                    console.log('Login successful:', data);
                    setShowAlertSuc(true)
                    setTimeout(() => {router.push("/");

                    }, 2000);
                } else {
                    setAlertMessage(data.error || 'Unknown error')
                    setShowAlertError(true)
                }
            } catch (error) {
                let errorMessage = "Failed to login"
                if (error instanceof Error) {
                    errorMessage = error.message
                }
                setAlertMessage(errorMessage)
                setShowAlertError(true)
                console.error('Login failed:', error);
            }
        };

  return (
        <div className="w-full h-full">
            <section className="bg-[#1c2532] dark:bg-gray-900">
                <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
                    <Link href="/" className="flex items-center mb-6 text-2xl font-semibold text-white dark:text-white hover:underline">
                        &#x2190; Go Back to Dashboard
                    </Link>
                    <div className="w-full bg-gray-400 rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
                        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                            <h1 className="text-xl text-center font-bold tracking-tight text-gray-900 md:text-2xl dark:text-white">
                                Login into Your Account
                            </h1>
                            <form className="space-y-4 md:space-y-4" onSubmit={handleSubmit}>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">Your email</label>
                                    <input 
                                        type="email" 
                                        name="email" 
                                        value={formData.email}
                                        onChange={handleChange}
                                        required 
                                        className="bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" 
                                        placeholder="name@gmail.com">
                                    </input>
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                                    <input 
                                        type="password" 
                                        name="password" 
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" 
                                        placeholder="••••••••">
                                    </input>
                                </div>
                                <div>
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
                                                <span className="block font-bold sm:inline">Login Successful! Redirecting to the DashBoard</span>
                                            </div>
                                            <div className="flex items-start col-span-1" onClick={() => setShowAlertSuc(false)}>
                                                <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button type="submit" className="w-full text-white bg-[#1c2532] hover:bg-primary-100 focus:ring-4 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                                    Login
                                </button>
                                <p className="text-sm text-gray-900 dark:text-gray-400">
                                    <Link href="/register" className="font-medium text-primary-600 hover:underline dark:text-primary-500">Don't have an account? Create one</Link>
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
        
  );
}