// Layout component to structure main UI of the note collections with the sidebar, notes list area, and preview area.
'use client';

import {useState, useEffect, Dispatch, SetStateAction} from 'react';
import {useRouter} from 'next/navigation';
import SearchBar from './SearchBar'
import {Menu} from 'lucide-react';
import UserSide from './Sidebar-Notes'

interface LayoutProps {
  children: React.ReactNode;
  addedNote: boolean
  setAdded: Dispatch<SetStateAction<boolean>>
}

const NotesLayout: React.FC<LayoutProps> = ({ children, addedNote, setAdded}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();

  const [whoami, setWhoAmI] = useState<string>("")
  const [role, setRole] = useState<string | null>(null)
      
  useEffect(() => {
      const pullWhoAmI = async () => {
          try {
              const response = await fetch(`flask-api/whoami`)
              const data = await response.json()

              if (data.error) {
                  console.log(data.errro)
                  router.push("/");
              } else {
                  setWhoAmI(data.message)
                  setRole(data.role)
              }
          } catch (err) {
              console.error("didn't even get data")
          }
      };
      pullWhoAmI()
  }, [ ])

  // const toggleSidebar = () => {
  //   setIsSidebarOpen(!isSidebarOpen);
  // };

  // const navigation = [    
  //   { name: 'Home', href: '/'},
  //   { name: 'Atlas Viewer', href: '/atlas'},
  //   { name: 'Created Collections', href: '/collections'},
  //   // { name: 'Saved Articles', href: '/saved-articles'},
  //   // { name: 'Settings', href: '/settings'},
  // ];

  return (
    <div className = "min-h-screen w-full bg-gray-100 flex">
      <div className='flex'>
        <div>
          <UserSide user={whoami} role={role}/>
        </div>
      </div>
      {/* Main Content Area */}
      <div className='flex-1 ml-56'>
        <div className="flex items-center justify-end h- bg-gray-100  py-2 px-2">
        
          {/* Search Bar Area */}
          <div className="flex items-center px-4 pt-4 pb-1">
          <SearchBar user_id={whoami} addedNote={addedNote} setAdded={setAdded}/>
          </div>
        </div>

        <main className="py-2 px-6">
          {children}
        </main>

        {/* Preview of Note if selected */}
        {/* <NotePreview>
          <h3>Note Preview</h3>
        </NotePreview> */}
      </div>
    </div>
  );
};

export default NotesLayout;