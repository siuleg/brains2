'use client';

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import React from "react";
import RightInfoPanel from "./Right-Side-Bar";
import LeftInfoPanel from "./Left-Side-Bar";
import CreateNote from "./Create-Note";
import Link from "next/link";

type Coordinates = { x: number; y: number };

export default function BrainAtlasViewer() {
  const svgContainerRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const initialTransform = d3.zoomIdentity.translate(0, 0).scale(0.6);

  const [coordinates, setCoordinates] = useState<Coordinates>({ x: 0, y: 0 });
  const [selectedLevel, setSelectedLevel] = useState(29);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(['layer-MC3']));
  const [viewingImage, setViewImage] = useState("levels/level-29.svg");
  const [selectedTiles, setSelectedTiles] = useState<Set<string>>(new Set());
  const selectedTilesRef = useRef<Set<string>>(new Set());
  const [selectedColor, setSelectedColor] = useState<string>("blue");
  const selectedColorRef = useRef<string>("blue");
  const [savedTransform, setSavedTransform] = useState<d3.ZoomTransform | null>(null);
  const [hoveredTile, setHoveredTile] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [hoveredText, setHoveredText] = useState<string | null>(null);
  const [isCheck, setIsCheck] = useState(false);
  const [isCheckTest, setIsCheckTest] = useState(false);
  const [overlaySVG, setOverlaySVG] = useState<string | null>(null);
  const [showStereotaxic, setShowStereotaxic] = useState<boolean>(false);
  const [physicalCoords, setPhysicalCoords] = useState<{ x: number; y: number } | null>(null);
  const [user_id, setUserID] = useState<string | null>(null);

  const levels = [22, 23, 24, 25, 26, 27, 28, 29, 30];

  useEffect(() => {
    selectedTilesRef.current = selectedTiles;
  }, [selectedTiles]);

  useEffect(() => {
    selectedColorRef.current = selectedColor;
    const gSelection = d3.select(gRef.current);
    if (!gSelection.empty()) {
      const tiles = gSelection.selectAll("#layer-grid rect");
      tiles.each(function () {
        const tile = d3.select(this);
        const id = tile.attr("id");
        if (id && selectedTilesRef.current.has(id)) {
          tile.style("fill", selectedColorRef.current);
        }
      });
    }
  }, [selectedColor]);

  const handleRecenter = () => {
    if (zoomRef.current && svgContainerRef.current) {
      d3.select(svgContainerRef.current)
        .transition()
        .duration(500)
        .call(zoomRef.current.transform, initialTransform);
    }
  };

  const handleLevelChange = (level: number) => {
    const path = `levels/level-${level}.svg`;
    setSelectedLevel(level);
    setViewImage(path);
    setOverlaySVG(null);
    setShowStereotaxic(false);
    setIsCheck(false);
    setSelectedTiles(new Set());
  };

  const toggleLayers = (layerId: string) => {
    setActiveLayers(prev => {
      const layer = new Set(prev);
      layer.has(layerId) ? layer.delete(layerId) : layer.add(layerId);
      return layer;
    });
  };

  const handleToggleGrid = () => {
    setViewImage(isCheck
      ? `levels/level-${selectedLevel}.svg`
      : `completes/level-${selectedLevel}-grid-brain.svg`
    );
    setIsCheck(!isCheck);
  };

  const handleToggleGridTest = () => {
    setViewImage(isCheckTest
      ? `levels/level-${selectedLevel}.svg`
      : `grid/level-${selectedLevel}-grid.svg`
    );
    setIsCheckTest(!isCheckTest);
  };

  const clearTileColors = () => {
    const g = d3.select(gRef.current);
    g.selectAll("#layer-grid rect")
      .style("fill", "white")
      .style("stroke", null)
      .style("stroke-width", null);
    setSelectedTiles(new Set());
  };

  const selectAllTiles = () => {
    const g = d3.select(gRef.current);
    const allTiles = g.selectAll("#layer-grid rect");
    const newSelected = new Set<string>();
    allTiles.each(function () {
      const id = d3.select(this).attr("id");
      if (id) newSelected.add(id);
    });
    setSelectedTiles(newSelected);
    updateTileHighlights(g, newSelected);
    applyFillToTiles(g, newSelected, selectedColorRef.current);
  };

  const exportTileData = () => {
    const data = Array.from(selectedTiles).map((id) => ({ id }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "selected-tile-data.json";
    link.click();
  };

  const updateTileHighlights = (gSelection: d3.Selection<any, unknown, any, any>, tileIds: Set<string>) => {
    const tiles = gSelection.selectAll("#layer-grid rect");
    tiles.each(function () {
      const tile = d3.select(this);
      const id = tile.attr("id");
      if (id && tileIds.has(id)) {
        tile.style("stroke", "black").style("stroke-width", 2);
      } else {
        tile.style("stroke", null).style("stroke-width", null);
      }
    });
  };

  const applyFillToTiles = (gSelection: d3.Selection<any, unknown, any, any>, tileIds: Set<string>, color: string) => {
    const tiles = gSelection.selectAll("#layer-grid rect");
    tiles.each(function () {
      const tile = d3.select(this);
      const id = tile.attr("id");
      if (id && tileIds.has(id)) {
        tile.style("fill", color);
      } else {
        tile.style("fill", "white");
      }
    });
  };

  const setupTileEvents = (gSelection: d3.Selection<any, unknown, any, any>) => {
    const gridTiles = gSelection.select("#layer-grid")?.selectAll("rect");
    if (!gridTiles.empty()) {
      gridTiles
        .style("cursor", "pointer")
        .on("mouseover", function () {
          const tile = d3.select(this);
          tile.style("stroke", "black").style("stroke-width", 2);
          setHoveredTile(tile.attr("id"));
        })
        .on("mouseout", function () {
          const tile = d3.select(this);
          const id = tile.attr("id");
          if (!selectedTilesRef.current.has(id)) {
            tile.style("stroke", null).style("stroke-width", null);
          }
          setHoveredTile(null);
        })
        .on("click", function (event) {
          const tile = d3.select(this);
          const id = tile.attr("id") || "unknown";
          const isShiftPressed = event.shiftKey;
          setSelectedTiles(prev => {
            const updated = new Set(prev);
            if (isShiftPressed) {
              updated.has(id) ? updated.delete(id) : updated.add(id);
            } else {
              updated.clear();
              updated.add(id);
            }
            updateTileHighlights(gSelection, updated);
            applyFillToTiles(gSelection, updated, selectedColorRef.current);
            return updated;
          });
        });
    }
  };

  useEffect(() => {
    const svgNode = svgContainerRef.current;
    if (!svgNode) return;

    d3.select(svgNode).selectAll("*").remove();

    d3.xml(viewingImage).then((data) => {
      const importedNode = document.importNode(data.documentElement, true);
      svgNode.appendChild(importedNode);

      const embeddedSvg = svgNode.querySelector("svg");
      if (!embeddedSvg) return;

      const svg = d3.select(svgNode);
      const g = d3.select(document.createElementNS("http://www.w3.org/2000/svg", "g"));
      gRef.current = g.node();
      svg.append(() => g.node());

      while (embeddedSvg.childNodes.length > 0) {
        g.node()?.appendChild(embeddedSvg.childNodes[0]);
      }

      svg.attr("width", "100%").attr("height", "600px");

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.6, 5])
        .on("zoom", (event) => {
          d3.select(gRef.current).attr("transform", event.transform);
          setSavedTransform(event.transform);
        });

      svg.call(zoom);
      zoomRef.current = zoom;

      if (savedTransform) {
        svg.call(zoom.transform, savedTransform);
      } else {
        svg.call(zoom.transform, initialTransform);
      }

      const gSelection = d3.select(gRef.current);

      gSelection.selectAll("text")
        .style("cursor", "pointer")
        .on("mouseover", function () {
          setHoveredText(d3.select(this).text());
        })
        .on("mouseout", function () {
          setHoveredText(null);
        })
        .on("click", function () {
          const textElement = d3.select(this);
          setSelectedText(textElement.text());
          gSelection.selectAll("text").attr("fill", "black");
          textElement.attr("fill", "red");
        });

      gSelection.selectAll("g").attr("style", "display: none");
      activeLayers.forEach((layerId) => {
        gSelection.select(`#${layerId}`).attr("style", "display: inline");
        if (layerId.startsWith("Grid")) {
          gSelection.select("#layer-grid").attr("style", "display: inline");
        }
      });

      updateTileHighlights(gSelection, selectedTilesRef.current);
      applyFillToTiles(gSelection, selectedTilesRef.current, selectedColorRef.current);
      setupTileEvents(gSelection);
    });
  }, [viewingImage]);

  useEffect(() => {
    const gSelection = d3.select(gRef.current);
    if (!gSelection.empty()) {
      gSelection.selectAll("g").attr("style", "display: none");
      activeLayers.forEach((layerId) => {
        gSelection.select(`#${layerId}`).attr("style", "display: inline");
        if (layerId.startsWith("Grid")) {
          gSelection.select("#layer-grid").attr("style", "display: inline");
        }
      });
    }
  }, [activeLayers]);

  return (
    <div className="w-full h-full">
      <div className="flex items-start justify-center">
        <div className="flex flex-col bg-white w-2/12">
          <LeftInfoPanel 
            selectedText={selectedText}
            setSelectedText={setSelectedText} 
            />
        </div>

        <div className="flex-1 flex-col w-8/12 h-screen app_main_color">
          {/* Level dropdown + Recenter */}
          <div className="flex items-center justify-start gap-2 px-2 pb-2 app_main_color">
              <label className="font-medium text-white">Level:</label>
              <select
                value={selectedLevel}
                onChange={(e) => handleLevelChange(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                {levels.map((level) => (
                  <option key={level} value={level}>
                    Level {level}
                  </option>
                ))}
              </select>
              <button
                onClick={handleRecenter}
                className="bg-gray-300 hover:bg-gray-400 text-black px-2 py-1 rounded"
              >
                Recenter
              </button>
              <div className="flex items-center justify-end gap-2 px-2 mt-2 mb-2 w-full">
                {/* <div className="text-white">
                  | App Nav |
                </div> */}
                <div>
                      <Link href="/" className="flex items-center p-1 text-white rounded-lg dark:text-white hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 group">
                          <svg className="w-6 h-6 text-white-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" 
                              aria-hidden="true" 
                              xmlns="http://www.w3.org/2000/svg" 
                              fill="currentColor" 
                              viewBox="0 0 16 16">
                              <path d="M1 6V15H6V11C6 9.89543 6.89543 9 8 9C9.10457 9 10 9.89543 10 11V15H15V6L8 0L1 6Z" />
                          </svg>
                          <span className="ms-3">Home</span>
                      </Link>
                </div>
                <div>
                      <Link href="/library" className="flex items-center p-1 text-white rounded-lg dark:text-white hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 group">
                          <svg className="shrink-0 w-6 h-6 text-white-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.425 13.953c0 0 24.137 0 24.173 0 0.583-0.255 0.557-0.802 0.011-1.165-0.547-0.365-12.119-8.718-12.119-8.718s-11.482 8.353-12.065 8.718c-0.582 0.363-0.619 0.91 0 1.165zM15.49 8.195c0.965 0 1.748 0.782 1.748 1.747s-0.783 1.748-1.748 1.748-1.747-0.783-1.747-1.748 0.782-1.747 1.747-1.747zM4.027 26.932h22.968v-0.977h-22.968v0.977zM9 24.936v-8.903h0.978v-1.103h-4.993v1.003h0.978v9.002h3.037zM17.030 24.936v-8.966h0.978v-0.978h-4.992v0.94h0.977v9.002h3.037zM3.030 28.93h24.963v-0.914h-24.963v0.914zM24.998 24.936v-8.966h0.978v-0.978h-4.993v0.94h0.979v9.002h3.036z"></path>
                          </svg>
                          <span className="flex-1 ms-3 whitespace-nowrap">Library</span>
                      </Link>
                </div>
                <div>
                      {/* Only changed performed here, rerouting to notes not collections. */}
                      <Link href="/notes" className="flex items-center p-1 text-white rounded-lg dark:text-white hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 group">
                          <svg className="shrink-0 w-5 h-5 text-white-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3V5M12 3V5M15 3V5M13 9H9M15 13H9M8.2 21H15.8C16.9201 21 17.4802 21 17.908 20.782C18.2843 20.5903 18.5903 20.2843 18.782 19.908C19 19.4802 19 18.9201 19 17.8V7.2C19 6.0799 19 5.51984 18.782 5.09202C18.5903 4.71569 18.2843 4.40973 17.908 4.21799C17.4802 4 16.9201 4 15.8 4H8.2C7.0799 4 6.51984 4 6.09202 4.21799C5.71569 4.40973 5.40973 4.71569 5.21799 5.09202C5 5.51984 5 6.07989 5 7.2V17.8C5 18.9201 5 19.4802 5.21799 19.908C5.40973 20.2843 5.71569 20.5903 6.09202 20.782C6.51984 21 7.07989 21 8.2 21Z" />
                          </svg>
                          <span className="flex-1 ms-3 whitespace-nowrap">Notes</span>
                      </Link>
                </div>
                <div>
                      <Link href="/search-results" className="flex items-center p-1 text-white rounded-lg dark:text-white hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 group">
                          <svg className="shrink-0 w-6 h-6 text-white-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 26 26">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" fillRule="evenodd" clipRule="evenodd" d="M9.29289 1.29289C9.48043 1.10536 9.73478 1 10 1H18C19.6569 1 21 2.34315 21 4V8C21 8.55228 20.5523 9 20 9C19.4477 9 19 8.55228 19 8V4C19 3.44772 18.5523 3 18 3H11V8C11 8.55228 10.5523 9 10 9H5V20C5 20.5523 5.44772 21 6 21H10C10.5523 21 11 21.4477 11 22C11 22.5523 10.5523 23 10 23H6C4.34315 23 3 21.6569 3 20V8C3 7.73478 3.10536 7.48043 3.29289 7.29289L9.29289 1.29289ZM6.41421 7H9V4.41421L6.41421 7ZM20.1716 18.7574C20.6951 17.967 21 17.0191 21 16C21 13.2386 18.7614 11 16 11C13.2386 11 11 13.2386 11 16C11 18.7614 13.2386 21 16 21C17.0191 21 17.967 20.6951 18.7574 20.1716L21.2929 22.7071C21.6834 23.0976 22.3166 23.0976 22.7071 22.7071C23.0976 22.3166 23.0976 21.6834 22.7071 21.2929L20.1716 18.7574ZM13 16C13 14.3431 14.3431 13 16 13C17.6569 13 19 14.3431 19 16C19 17.6569 17.6569 19 16 19C14.3431 19 13 17.6569 13 16Z"/>
                          </svg>
                          <span className="flex-1 ms-3 whitespace-nowrap">Paper Search</span>
                      </Link>
                </div>
              </div>
          </div>

          {/* <div className="flex flex-col h-screen">

          </div> */}
          
          <div className="h-[75vh] border-2 relative bg-gray-100">
            <svg ref={svgContainerRef} className="w-full h-full"></svg>
          </div>

          <div className="flex-1 flex-col pl-2 pt-2 pb-2 pr-2 app_main_color overflow-y-auto">
            <CreateNote
              onSubmit={(title, content) => {
                const createNote = async () => {
                  await fetch('/flask-api/notes/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      title,
                      content,
                      user_id: user_id,
                      region: selectedText,
                    }),
                  });
                };
                createNote();
              }}
              user_id={user_id ?? ''}
              disabled={false}
              isEditing={false}
              selectedText={selectedText}
            />
          </div>
        </div>

        <div className="flex flex-col bg-gray-200 w-2/12">
        <RightInfoPanel
            selectedLevel={selectedLevel}
            coordinates={coordinates}
            isCheck={isCheck}
            isCheckTest={isCheckTest}
            selectedTiles={Array.from(selectedTiles)}
            hoveredTile={hoveredTile}
            selectedText={selectedText}
            hoveredText={hoveredText}
            physicalCoords={physicalCoords}
            handleToggleGrid={handleToggleGrid}
            handleToggleGridTest={handleToggleGridTest}
            activeLayers={activeLayers}
            toggleLayers={toggleLayers}
            setShowStereotaxic={setShowStereotaxic}
            clearTileSelection={clearTileColors}
            selectAllTiles={selectAllTiles}
            exportTileData={exportTileData}
            setSelectedColor={setSelectedColor}
          />
        </div>
      </div>
    </div>
  );
}