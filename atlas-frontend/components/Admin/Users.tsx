'use client';

import { useState, useEffect, SetStateAction, Dispatch } from "react";
import React from "react";

type userInfo = {
    name: string
    email: string
    role: string
    status: string
}

const UsersAdminView: React.FC = () => {
    
    const [userArr, setUserArr] = useState<null | userInfo[]>([])
    const [userFieldChange, setUserChange] = useState<boolean>(false)
    const [showAlertError, setShowAlertError] = useState(false)
    const [showAlertSuc, setShowAlertSuc] = useState(false)
    const [alertMessage, setAlertMessage] = useState<string | null>(null)

    function handleFieldUpdate(userEmail: string, field: string, value: string | boolean) {
        setAlertMessage(null)
        setShowAlertError(false)
        setShowAlertSuc(false)
        const updateUserField = async () => {
            try {
                const response = await fetch('flask-api/field-update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email:  userEmail,
                        field: field,
                        value: value,
                    })
                })
                const data = await response.json()

                if (response.ok) {
                    console.log(data.message)
                    setUserChange(true)
                    setShowAlertSuc(true)
                    setAlertMessage("User with email: "+userEmail+" had "+field +" updated")
                } else {
                    console.error("failed to update field")
                    setAlertMessage(data.error || 'Unknown error')
                    setShowAlertError(false)
                }
            } catch (err) {
                console.error("big mess up here")
                console.error(err)
                setAlertMessage("Major Error")
                setShowAlertError(false)
            }
        }
        updateUserField()
    }
    
    useEffect(() => {
        const pullAllUsers = async () => {
            try {
                const response = await fetch(`flask-api/get-all-users`)
                const data = await response.json()

                if (data.error) {
                    console.error("Something bad")
                } else {
                    console.log(data)
                    setUserArr(data["message"])
                }
            } catch (err) {
                console.error("didn't even get data")
            }
        };
        pullAllUsers()
        setUserChange(false)
    }, [userFieldChange, ])

  return (
    <div>
        <div className="flex">
            <div className="w-4/6 text-4xl font-bold text-black ps-2 m-3">
                User Management
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
                            Username
                        </th>
                        <th scope="col" className="px-4 py-4">
                            Email
                        </th>
                        <th scope="col" className="px-4 py-4">
                            Role
                        </th>
                        <th scope="col" className="px-4 py-4">
                            Status
                        </th>
                        <th scope="col" className="px-4 py-4">
                            <span className="">Actions</span>
                        </th>
                        <th scope="col" className="px-4 py-4">
                            <span className="sr-only">Change Role</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {userArr && userArr.map((user, index) => (
                        <tr className="bg-white border-b text-center border-gray-200 hover:bg-gray-300" key={index}>
                            <td className="px-4 py-4 font-medium text-gray-900 whitespace-nowrap">
                                {user.name}
                            </td>
                            <td className="px-4 py-4 font-medium text-gray-900">
                                {user.email}
                            </td>
                            <td className="px-4 py-4 font-medium text-gray-900">
                                {user.role}
                            </td>
                            {user.status &&
                                <td className="px-4 py-4 font-medium text-gray-900 bg-green-500">
                                    Allowed
                                </td>
                            }
                            {!user.status &&
                                <td className="px-4 py-4 font-medium text-gray-900 bg-red-500">
                                    Blocked
                                </td>
                            }
                            <td className="font-medium text-gray-900 border-gray-200 border-r-2 border-l-2">
                                <button className="font-medium hover:underline" onClick={() => handleFieldUpdate(user.email, "role", user.role == "admin"? "user" : "admin")}>{user.role == "admin"? "Make User" : "Make Admin"}</button>
                            </td>
                            <td className="font-medium text-gray-900">
                                <button className="font-medium hover:underline" onClick={() => handleFieldUpdate(user.email, "status", user.status? false : true)}>{user.status? "Block" : "Allow"}</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}

export default UsersAdminView