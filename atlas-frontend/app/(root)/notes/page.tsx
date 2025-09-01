'use client'
// app/root/notes/page.tsx
import NotesLayout from '@/components/User-Notes/Notes-Layout';
import UserNote from '@/pages/user-notes';
import React, { useState} from 'react';

export default function NotesPage() {
  const [addedNote, setAdded] = useState(false)
  return (
    <div className="bg-pink-500 container max-w-full">{/*Fix the overflow problem*/}
      <NotesLayout addedNote={addedNote} setAdded={setAdded}>
        <UserNote addedNote={addedNote} />
      </NotesLayout>
    </div>
  );
}