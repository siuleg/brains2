import {useRef, useEffect, useState } from "react";

import hierarchyData from "./cns_hierarchyreal.json";

type RegionNode = {
  name: string;
  children: RegionNode[];
};

type rightInfo = {
  selectedText: string | null;
  setSelectedText: (text: string) => void;
};

const TreeNode: React.FC<{
  node: RegionNode;
  selectedText: string | null;
  searchTerm: string;
  onSelect: (name: string) => void;
  scrollOnceRef: React.RefObject<boolean>;
}> = ({ node, selectedText, searchTerm, onSelect, scrollOnceRef }) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const [shouldScroll, setShouldScroll] = useState(false);
  


  const matchSearch = searchTerm && node.name.toLowerCase().includes(searchTerm.toLowerCase());
  const matchSelected = selectedText && node.name.includes(selectedText);
  const hasMatchInChildren = (n: RegionNode): boolean =>
    n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (n.children || []).some(hasMatchInChildren);
    useEffect(() => {
      const hasSelectedInChildren = (n: RegionNode): boolean =>
        selectedText ? (n.name.includes(selectedText) || (n.children || []).some(hasSelectedInChildren)) : false;

      const matched =
        (searchTerm && (matchSearch || hasMatchInChildren(node))) ||
        matchSelected ||
        hasSelectedInChildren(node);

      if (matched) {
        setExpanded(true);
        if ((matchSearch || matchSelected) && !scrollOnceRef.current) {
          setShouldScroll(true);
        }
      }
    }, [searchTerm, selectedText]);

    useEffect(() => {
      if (shouldScroll && highlightRef.current && !scrollOnceRef.current) {
        highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        scrollOnceRef.current = true;
        setShouldScroll(false); 
      }
    }, [shouldScroll]);

    useEffect(() => {
      const hasSelectedInChildren = (n: RegionNode): boolean =>
        selectedText ? (n.name.includes(selectedText) || (n.children || []).some(hasSelectedInChildren)) : false;
    
      const matched =
        (searchTerm && (matchSearch || hasMatchInChildren(node))) ||
        matchSelected ||
        hasSelectedInChildren(node);
    
      if (matched) {
        setExpanded(true);
        if ((isSearchMatch || isSelectedMatch) && !scrollOnceRef.current) {
          setShouldScroll(true); 
        }
      }
    }, [searchTerm, selectedText]);    

  const isSearchMatch = searchTerm && node.name.toLowerCase().includes(searchTerm.toLowerCase());
  const isSelectedMatch = selectedText && node.name.includes(selectedText);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((isSearchMatch || isSelectedMatch) && highlightRef.current && !scrollOnceRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      scrollOnceRef.current = true;
    }
  }, [isSearchMatch, isSelectedMatch]);

  return (
    <div className="ml-2 mt-1">
      <div
        ref={isSearchMatch || isSelectedMatch ? highlightRef : null}
        className={`cursor-pointer text-sm px-1 py-0.5 rounded 
          ${isSearchMatch || isSelectedMatch ? 'bg-green-100 font-bold text-black' : ''}`}
        onClick={() => {
          const match = node.name.match(/\(([A-Z][A-Za-z0-9.\-]+)\)$/);
          const abbreviation = match ? match[1] : node.name;
          onSelect(abbreviation);
        }}
      >
        {hasChildren && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="mr-1 select-none"
          >
            {expanded ? "▼" : "▶"}
          </span>
        )}
        {node.name}
      </div>
      {expanded &&
        hasChildren &&
        node.children.map((child, idx) => (
          <TreeNode
            key={idx}
            node={child}
            selectedText={selectedText}
            searchTerm={searchTerm}
            onSelect={onSelect}
            scrollOnceRef={scrollOnceRef}
          />
        ))}
    </div>
  );
};

const LeftInfoPanel: React.FC<rightInfo> = ({
  selectedText,
  setSelectedText,
}) => {
  const [hierarchy, setHierarchy] = useState<RegionNode[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currUser, setCurrUser] = useState<string | null>(null);
  const scrollOnceRef = useRef(false);

  useEffect(() => {
    scrollOnceRef.current = false;
  }, [searchTerm, selectedText]);

  useEffect(() => {
    setHierarchy(hierarchyData);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("flask-api/whoami", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        setCurrUser(data.message);
      } catch (error) {
        let errorMessage = "Something bad";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        setCurrUser(errorMessage);
        console.error(errorMessage);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="p-2 border rounded-lg shadow-md h-screen overflow-y-scroll bg-gray-200">
      <div>
        <p className="font-semibold text-lg mb-2 border-b-black border-b-2">
          Current User: {currUser}
        </p>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for a region..."
          className="w-full p-1 text-sm border rounded"
        />
        {(searchTerm || selectedText) && (
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedText("");
            }}
            className="text-xs text-blue-600 underline whitespace-nowrap"
          >
            Clear
          </button>
        )}
      </div>

      <p className="font-semibold text-lg mb-2">CNS Hierarchy</p>
      <div className="text-sm max-h-full overflow-y-auto border p-2 bg-white rounded">
        {hierarchy.map((node, idx) => (
          <TreeNode
            key={idx}
            node={node}
            selectedText={selectedText}
            searchTerm={searchTerm}
            onSelect={setSelectedText}
            scrollOnceRef={scrollOnceRef}
          />
        ))}
      </div>
    </div>
  );
};

export default LeftInfoPanel;
