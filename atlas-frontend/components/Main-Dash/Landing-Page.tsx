'use client';

import MainSide from "./Sidebar";
import { useState, useEffect } from "react";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MainCar from "./Carousel";

export default function LandingPage() {

    const router = useRouter();
    // const [dashView, setDashView] = useState<string>("users")
    const [whoami, setWhoAmI] = useState<string | null>(null)
    const [role, setRole] = useState<string | null>(null)
    
    useEffect(() => {
        const pullWhoAmI = async () => {
            try {
                const response = await fetch(`flask-api/whoami`)
                const data = await response.json()

                if (data.error) {
                    // console.error("Something bad")
                    console.log("Not signed in")
                    setRole("not user")
                } else {
                    // if (data.role != "admin") {
                    //     router.push("/");
                    // }
                    setWhoAmI(data.message)
                    setRole(data.role)
                }
            } catch (err) {
                console.error("didn't even get data")
            }
        };
        pullWhoAmI()
    }, [ ])

  return (
        <div className="w-full">
            <div className="flex">
                <div>
                    <MainSide user={whoami} role={role}/>
                </div>
                <div className=" ml-56 bg-gray-400 h-screen w-screen">
                    <div className="text-sm font-medium text-gray-500">
                        <section className="relative w-full bg-primary h-[70vh] pattern flex justify-center items-center flex-col py-10 px-6">
                            <a href="/atlas" className="heading">View Atlas</a>
                            <p className="sub-heading !max-w-3xl">Precision Mapping for Breakthrough Understanding</p>
                            <div className="absolute bottom-2 left-4 text-white text-xl">
                                Supported Levels in the Atlas
                            </div>
                        </section>
                    </div>
                    <div className="h-[20vh]">
                        <MainCar/>
                    </div>
                </div>
            </div>
        </div>
        
  );
}