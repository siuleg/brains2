'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import "../app/globals.css"
import UploadForm from '@/components/Library/Upload-Form';
import LibraryList from '@/components/Library/Library-List';
import PaperSidebar from '@/components/Library/Paper-Sidebar';
import LibSide from '@/components/Library/Sidebar';

export default function LibraryPage() {
  const baseUrl = 'flask-api';
  const router = useRouter();
  const [userID, setUserID] = useState('');
  const [userRole, setUserRole] = useState("")
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [library, setLibrary] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${baseUrl}/whoami`, { credentials: 'include' });
        if (!res.ok) throw new Error('Not authenticated');
        const data = await res.json();
        setUserID(data.message);
        setUserRole(data.role)
        setAuthenticated(true);
      } catch (err) {
        console.error(err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (authenticated && userID) fetchLibrary();
  }, [authenticated, userID]);

  const fetchLibrary = async () => {
    try {
      const res = await fetch(`${baseUrl}/library?user_id=${userID}`);
      const data = await res.json();
      setLibrary(data);
    } catch (err) {
      console.error('Failed to fetch library:', err);
    }
  };

  if (loading) return <p className="p-6 text-gray-500">Loading...</p>;
  if (!authenticated) return null;

  return (
    <div className="flex h-screen w-screen bg-gray-100">
      <div>
        <LibSide user={userID} role={userRole}/>
      </div>
      <div className='ml-56 flex'>
        <div className={`${selectedPaper ? 'w-2/3' : 'w-full'} transition-all duration-300 p-6 overflow-y-auto`}>
          <UploadForm userID={userID} onUploadComplete={fetchLibrary} />
          <LibraryList library={library} onSelect={setSelectedPaper} />
        </div>

        {selectedPaper && (
          <div className="w-1/3 border-l">
            <PaperSidebar
              paper={selectedPaper}
              setPaper={setSelectedPaper}
              userID={userID}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              fetchLibrary={fetchLibrary}
            />
          </div>
        )}
      </div>
    </div>
  );
}
