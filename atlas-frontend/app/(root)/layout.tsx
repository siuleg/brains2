'use client';

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
    const pathname = usePathname() || "/"
    const noNavBar = ["/atlas", "/login", "/register", "/admin", "/notes", "/collections", "/create", "/"]
    
    return (
        // <main className = " h-screen overflow-hidden font-work-sans">
        //     {!noNavBar.includes(pathname) && <Navbar />}

        //     {children}
        // </main>
        <main className="flex flex-col h-screen font-work-sans">
            {!noNavBar.includes(pathname) && <Navbar />}
            <div>
                {children}
            </div>
        </main>
    )   
}