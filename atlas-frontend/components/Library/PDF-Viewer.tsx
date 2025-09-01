'use client';
import React, { useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PDFViewer({
  formData,
  zoom,
  setZoom,
  highlightMode,
  setHighlightMode,
  annotations,
  onDeleteAnnotation,
  onDocumentLoadSuccess,
  formatDate
}) {
  const annotationsRef = useRef(null); 
  const scrollToAnnotations = () => {
    if (annotationsRef.current) {
      annotationsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="h-[80vh] overflow-y-auto">
      <h3 className="text-lg font-bold mb-4">PDF Viewer</h3>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setHighlightMode(prev => !prev)}
          className={`px-2 py-1 rounded ${
            highlightMode ? 'bg-yellow-300 text-black' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          🖍️ {highlightMode ? 'Highlighting...' : 'Highlight'}
        </button>

        <button
          onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          ➖ Zoom Out
        </button>

        <span className="text-sm text-gray-600">Zoom: {(zoom * 100).toFixed(0)}%</span>

        <button
          onClick={() => setZoom(prev => Math.min(prev + 0.1, 3))}
          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          ➕ Zoom In
        </button>

        {/* New Button */}
        <button
          onClick={scrollToAnnotations}
          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          Go to Annotations
        </button>
      </div>

      {formData.pdf_url ? (
        <Document
          file={formData.pdf_url}
          onLoadSuccess={onDocumentLoadSuccess}
          className="border"
        >
          {Array.from(new Array(formData.numPages), (_, index) => (
            <Page key={`page_${index + 1}`} pageNumber={index + 1} width={650 * zoom} />
          ))}
        </Document>
      ) : formData.source_url ? (
        <a
          href={formData.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline text-sm"
        >
          View Source Article
        </a>
      ) : (
        <p className="text-sm text-gray-400">No PDF or source available</p>
      )}

      {/* Annotations Section with ref */}
      <div className="mt-4" ref={annotationsRef}>
        <h4 className="font-bold text-sm mb-1">Annotations</h4>
        {annotations.length === 0 ? (
          <p className="text-sm italic text-gray-400">No Annotations yet.</p>
        ) : (
          <ul className="text-sm space-y-2">
            {annotations.map((ann, idx) => (
              <li key={ann.id} className="flex justify-between items-start bg-yellow-100 p-2 rounded">
                <div>
                  <div>{ann.text}</div>
                  <div className="text-xs text-gray-500">{formatDate(ann.created_at)}</div>
                </div>
                <button
                  onClick={() => onDeleteAnnotation(ann.id)}
                  className="text-xs text-red-500 hover:underline ml-2"
                >
                  ✖
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
