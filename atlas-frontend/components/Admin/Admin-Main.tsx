'use client';

import AdminSide from "./Sidebar";
import UsersAdminView from "./Users";
import NotesAdminView from "./Notes";
import { useState, useEffect } from "react";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Dash = {
    dash:string
}

export default function AdminMain() {

    const router = useRouter();
    const [dashView, setDashView] = useState<string>("users")
    const [whoami, setWhoAmI] = useState<string | null>(null)
    
    useEffect(() => {
        const pullWhoAmI = async () => {
            try {
                const response = await fetch(`flask-api/whoami`)
                const data = await response.json()

                if (data.error) {
                    console.log(data.errro)
                    router.push("/");
                } else {
                    if (data.role != "admin") {
                        router.push("/");
                    }
                    setWhoAmI(data.message)
                }
            } catch (err) {
                console.error("didn't even get data")
            }
        };
        pullWhoAmI()
    }, [ ])

    function RenderDash({dash}:Dash) {
        if (dash == "users") {
            return <UsersAdminView/>
        } else if (dash == "notes"){
            return <NotesAdminView/>
        } else {
            return <div>Loading View</div>
        }
    }

  return (
        <div className="w-full">
            <div className="flex">
                <div>
                    <AdminSide adminFunc={dashView} user={whoami} setAdminFunc={setDashView}/>
                </div>
                <div className="ml-56 bg-gray-400 h-screen w-screen">
                    <div className="text-sm font-medium text-gray-500">
                        <RenderDash dash={dashView}/>
                    </div>
                </div>
            </div>
        </div>
        
  );
}