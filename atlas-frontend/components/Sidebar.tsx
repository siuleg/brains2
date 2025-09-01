// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { Transition } from '@headlessui/react';

// export default function Sidebar() => {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//   const router = useRouter();
//   // const pathname = usePathname();

//   const navigation = [
//     { name: 'Dashboard', href: '/'},
//     { name: 'Collections', href: '/notes-collection'}, // When this is selected change to display the list of categories, such as "Personal", "Shared", "Saved" libraries
//     { name: 'Saved Articles', href: '/saved-articles'},
//   ];
  
//   const toggleSidebar = () => {
//     setIsSidebarOpen(!isSidebarOpen);
//   };

//   return (
//     <div className = "min-h-screen bg-gray-100 flex">
//       {/* Sidebar */}
//       <Transition
//         show = {isSidebarOpen}
//         enter = "transition-all duration-300 ease-in-out"
//         enterFrom = "-ml-64"
//         enterTo = "ml-0"
//         leave = "transition-all duration-300 ease-in-out"
//         leaveFrom = "ml-0"
//         leaveTo = "-ml-64"
//       >
//         <div className = "bg-gray-800 text-white w-64 flex flex-col h-screen fixed top-0 left-0 shadow-md z-10">
//           <div className = "p-4 flex justify-between items-center">
//             <button onClick = {toggleSidebar} className = "text-gray-400 hover:text-white focus:outline-none">
//               <svg className = "h-6 w-6" fill = "none" viewBox = "0 0 24 24" stroke = "currentColor">
//                 <path strokeLinecap = "round" strokeLinejoin = "round" strokeWidth = {2} d = "M6 18L18 6M6 6l12 12"/>
//               </svg>
//             </button>
//           </div>

//           <nav className="mt-4"> {
//             navigation.map((item) => (
//               <a key = {item.name}
//                  href = {item.href}
//                  className = {`flex items-center p-4 hover:bg-gray-700 ${
//                  router.pathname === item.href ? 'bg-gray-700 font-semibold' : ''}`}>
//                 <span>{item.name}</span>
//               </a>
//             ))}
//           </nav>
//         </div>
//       </Transition>

//       {/* Toggle Button (only visible if sidebar is closed)*/}
//       {!isSidebarOpen && (
//         <button
//           onClick = {toggleSidebar}
//           className = "fixed top-4 left-4 bg-gray-700 text-white rounded-md p-2 z-20 shadow-md focus:outline-none"
//         >
//           <svg className = "h-6 w-6" fill = "none" viewBox="0 0 24 24" stroke = "currentColor">
//             <path strokeLinecap = "round" strokeLinejoin = "round" strokeWidth = {2} d = "M4 6h16M4 12h16M4 18h16"/>
//           </svg>
//         </button>
//       )}
//           </div>
//     );
// }

// export default Sidebar;