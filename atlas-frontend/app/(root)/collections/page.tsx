// Shows all of the folders (collections) the user has created
import NotesLayout from '@/components/User-Notes/Notes-Layout';
import SavedCollections from '@/components/User-Collection/Saved-Collections';

export default function Collections() {

  return (
    <div className="container max-w-full"> 
          <SavedCollections>
            
          </SavedCollections>

    </div>
  );
}