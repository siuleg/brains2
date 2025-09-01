import React from 'react';

export default function MetadataEditor({ formData, onChange, onNestedChange, onSave, onDelete, onClose }) {
  return (
    <div>
      <label className="block font-bold">Title</label>
      <input
        value={formData.title || ''}
        onChange={e => onChange("title", e.target.value)}
        className="w-full border p-2 mb-2"
      />

      <label className="block font-bold">Authors</label>
      <textarea
        value={formData.authors?.join(', ') || ''}
        onChange={e => onChange("authors", e.target.value.split(',').map(a => a.trim()))}
        className="w-full border p-2 mb-2"
      />

      {Object.entries({ ...formData.identifiers }).map(([key, value]) => (
        <div key={key} className="mb-2">
          <label className="block font-bold">{key.toUpperCase()}</label>
          <input
            value={value || ''}
            onChange={e => onNestedChange("identifiers", key, e.target.value)}
            className="w-full border p-2"
          />
        </div>
      ))}

      <label className="block font-bold">Journal</label>
      <input
        value={formData.journal || ''}
        onChange={e => onChange("journal", e.target.value)}
        className="w-full border p-2 mb-2"
      />

      <label className="block font-bold">Year</label>
      <input
        value={formData.year || ''}
        onChange={e => onChange("year", e.target.value)}
        className="w-full border p-2 mb-2"
      />

      <label className="block font-bold">Notes</label>
      <textarea
        value={formData.user_notes || ''}
        onChange={e => onChange("user_notes", e.target.value)}
        className="w-full border p-2 mb-2"
      />

      <div className="flex justify-between mt-4">
        <button onClick={onClose} className="text-sm text-gray-600 hover:underline">Close</button>
        <div className="flex gap-2">
          <button onClick={onDelete} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
          <button onClick={onSave} className="px-3 py-1 bg-blue-500 text-white rounded">Save</button>
        </div>
      </div>
    </div>
  );
}
