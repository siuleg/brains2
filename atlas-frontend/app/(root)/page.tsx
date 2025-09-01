'use client'
import { useState, useEffect } from "react";
import Link from "next/link";
import LandingPage from "@/components/Main-Dash/Landing-Page";

export default function Home() {

    const [role, setRole] = useState<string | null>(null)
        
    useEffect(() => {
        const pullWhoAmI = async () => {
            try {
                const response = await fetch(`flask-api/whoami`)
                const data = await response.json()

                if (data.error) {
                    console.log("Not logged in")
                } else {
                    console.log(data)
                    setRole(data.role)
                }
            } catch (err) {
                console.error("didn't even get data")
            }
        };
        pullWhoAmI()
    }, [ ])

  return (
    <div className="h-full flex flex-col justify-between">
        <LandingPage/>
    </div>
  );
}