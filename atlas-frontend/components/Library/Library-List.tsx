'use client';
import React, { useState, useMemo } from 'react';

interface Paper {
  _id: string;
  title: string;
  journal?: string;
  year?: string;
  user_notes?: string;
}

interface LibraryListProps {
  library: Paper[];
  onSelect: (paper: Paper) => void;
}

export default function LibraryList({ library, onSelect }: LibraryListProps) {
  const [sortOption, setSortOption] = useState('title-az');

  const sortedLibrary = useMemo(() => {
    return [...library].sort((a, b) => {
      if (sortOption === 'title-az') return a.title.localeCompare(b.title);
      if (sortOption === 'title-za') return b.title.localeCompare(a.title);
      if (sortOption === 'year-newest') return (b.year || 0) - (a.year || 0);
      if (sortOption === 'year-oldest') return (a.year || 0) - (b.year || 0);
      return 0;
    });
  }, [library, sortOption]);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">Your Library</h2>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          <option value="title-az">Title A-Z</option>
          <option value="title-za">Title Z-A</option>
          <option value="year-newest">Year Newest → Oldest</option>
          <option value="year-oldest">Year Oldest → Newest</option>
        </select>
      </div>

      <div className="grid grid-cols-4 gap-4 px-4 py-2 border-b font-semibold text-sm text-gray-600">
        <span>Title</span>
        <span>Journal</span>
        <span>Year</span>
        <span>Notes</span>
      </div>

      <div className="space-y-2">
        {sortedLibrary.map(paper => (
          <div
            key={paper._id}
            onClick={() => onSelect(paper)}
            className="grid grid-cols-4 gap-4 px-4 py-3 hover:bg-gray-50 border-b cursor-pointer text-sm bg-gray-200"
          >
            <div className="font-medium">{paper.title}</div>
            <div className="text-gray-600">{paper.journal || '—'}</div>
            <div className="text-gray-600">{paper.year || '—'}</div>
            <div className="italic text-gray-500">{paper.user_notes || 'No notes'}</div>
          </div>
        ))}
      </div>
    </>
  );
}
