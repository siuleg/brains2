import React from 'react';

export default function PaperDetails({ formData }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">{formData.title}</h2>
      <p className="text-sm italic text-gray-600 mb-2">{formData.authors?.join(', ')}</p>
      <p className="text-sm mb-1"><strong>Journal:</strong> {formData.journal || 'N/A'}</p>
      <p className="text-sm mb-4"><strong>Year:</strong> {formData.year || 'N/A'}</p>

      <div className="mb-4">
        <h4 className="font-semibold text-sm text-gray-700">Abstract</h4>
        <p className="text-sm text-gray-800 whitespace-pre-line">{formData.abstract}</p>
      </div>

      {formData.pdf_url && (
        <a
          href={formData.pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline text-sm block mt-2"
        >
          View PDF
        </a>
      )}

      <div className="mt-4">
        <h4 className="font-semibold text-sm">Your Notes</h4>
        <p className="text-sm text-gray-700">{formData.user_notes || "No notes yet."}</p>
      </div>
    </div>
  );
}
