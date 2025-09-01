import { Dispatch, SetStateAction, useState } from "react";
import RegionInfo from "./Selected-Region-Info";

type rightInfo = {
  selectedLevel: number | null;
  coordinates: { x: number; y: number };
  isCheck: boolean;
  isCheckTest: boolean;
  selectedTiles: string[];
  hoveredTile: string | null;
  hoveredText: string | null;
  selectedText: string | null;
  physicalCoords: { x: number; y: number } | null;
  handleToggleGrid: () => void;
  handleToggleGridTest: () => void;
  toggleLayers: (layerId: string) => void;
  activeLayers: Set<string>;
  setShowStereotaxic: Dispatch<SetStateAction<boolean>>;
  clearTileSelection: () => void;
  selectAllTiles: () => void;
  exportTileData: () => void;
  setSelectedColor: React.Dispatch<React.SetStateAction<string>>;
 
};

const RightInfoPanel: React.FC<rightInfo> = ({
  selectedLevel,
  coordinates,
  isCheck,
  isCheckTest,
  selectedTiles,
  hoveredTile,
  hoveredText,
  selectedText,
  physicalCoords,
  handleToggleGrid,
  handleToggleGridTest,
  toggleLayers,
  activeLayers,
  setShowStereotaxic,
  clearTileSelection,
  selectAllTiles,
  exportTileData,
  setSelectedColor,
}) => {
  const [activeTab, setActiveTab] = useState("tab1");
  return (
    <div className="flex flex-col overflow-y-auto p-2 border rounded-lg bg-gray-200 shadow-md h-screen">
      <p className="font-semibold text-lg">
        Atlas Level: {selectedLevel !== null ? selectedLevel : "N/A"}
      </p>
      <div className="w-full">
      <div className="flex border-b border-gray-500">
        <button
          onClick={() => setActiveTab("tab1")}
          className={`px-4 py-2 -mb-px font-semibold border-b-2 ${activeTab === "tab1" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"}`}>
          Atlas Info
        </button>
        <button
          onClick={() => setActiveTab("tab2")}
          className={`px-4 py-2 -mb-px font-semibold border-b-2 ${activeTab === "tab2" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"}`}>
          Region Info
        </button>
      </div>

      <div className="mt-2">
        {activeTab === "tab1" && <div>
        <p className="font-semibold text-lg">Region Info</p>
        <pre className=""> Hovered: {hoveredText ? <span>{hoveredText}</span> : <span>None</span>}</pre>
        <pre className=""> Selected: {selectedText ? <span>{selectedText}</span> : <span>None</span>}</pre>
        <p className="font-semibold text-lg">
          Tiles Info
        </p>
        <pre className=""> Hovered Tile: {hoveredTile ? hoveredTile.slice(5, 7) : 'None'}</pre>
        <pre className=""> Selected:</pre>
        <div className="grid grid-cols-5 gap-1 text-sm max-h-40 overflow-y-auto pl-2">
          {selectedTiles.length > 0 ? (
            selectedTiles.map(tile => (
              <div className="border border-black-200 rounded-md text-center ml-1 mr-1" key={tile}>{tile.slice(5, 7)}</div>
            ))
          ) : (
            <div className="col-span-4">None Selected</div>
          )}
        </div>

        <div className="pl-2">
          <label className="text-sm font-medium block mb-1 mt-1 pl-2">Tile Highlight Color</label>
          <select
            onChange={(e) => setSelectedColor(e.target.value)}
            className="w-full border rounded border-black px-2 py-1 text-sm"
          >
          <option value="blue">Blue</option>
          <option value="red">Red</option>
          <option value="yellow">Yellow</option>
          <option value="cyan">Cyan</option>
          <option value="white">No color</option>  
          </select>
      </div>
        <div className="flex gap-2 my-2 pl-2">
          <button
            className="px-2 py-0.5 text-xs app_main_color text-white rounded hover:bg-gray-500 transition"
            onClick={clearTileSelection}
            >
            Clear
          </button>
          <button
            className="px-2 py-0.5 text-xs app_main_color text-white rounded hover:bg-gray-500 transition"
            onClick={selectAllTiles}
            >
            Select All
          </button>
          <button
            className="px-2 py-0.5 text-xs app_main_color text-white rounded hover:bg-gray-500 transition"
            onClick={exportTileData}
            >
            Export
          </button>
        </div>
          <p className="font-semibold text-lg mt-2">Layer Selection</p>
          <div className="mb-4 inline-flex items-center">
            <div className="space-y-2">
              <label className="flex items center space-x-2">
                <input
                  type="checkbox"
                  checked={activeLayers.has('Grid_-_Solid_Color_-_Opacity_25_x25_')}
                  onChange={() => toggleLayers('Grid_-_Solid_Color_-_Opacity_25_x25_')}
                  className="rounder border-grey-300"
                />
                <span className="text-sm"><pre>Grid - Solid</pre></span>
              </label>
              <label className="flex items center space-x-2">
                <input
                  type="checkbox"
                  checked={activeLayers.has('layer-MC7')}
                  onChange={() => toggleLayers('layer-MC7')}
                  className="rounder border-grey-300"
                />
                <span className="text-sm"><pre>Stereotaxic Coordinates</pre></span>
              </label>
              <label className="flex items center space-x-2">
                <input
                  type="checkbox"
                  checked={activeLayers.has('layer-MC6')}
                  onChange={() => toggleLayers('layer-MC6')}
                  className="rounder border-grey-300"
                />
                <span className="text-sm"><pre>Box for Database/3D Model</pre></span>
              </label>
              <label className="flex items center space-x-2">
                <input
                  type="checkbox"
                  checked={activeLayers.has('layer-MC5')}
                  onChange={() => toggleLayers('layer-MC5')}
                  className="rounder border-grey-300"
                />
                <span className="text-sm"><pre>Nissl-Stain</pre></span>
              </label>
              <label className="flex items center space-x-2">
                <input
                  type="checkbox"
                  checked={activeLayers.has('layer-MC4')}
                  onChange={() => toggleLayers('layer-MC4')}
                  className="rounder border-grey-300"
                />
                <span className="text-sm"><pre>Blue Ventricle Overlay</pre></span>
              </label>
              <label className="flex items center space-x-2">
                <input
                  type="checkbox"
                  checked={activeLayers.has('layer-MC3')}
                  onChange={() => toggleLayers('layer-MC3')}
                  className="rounder border-grey-300"
                />
                <span className="text-sm"><pre>Mapping Atlas</pre></span>
              </label>
              <label className="flex items center space-x-2">
                <input
                  type="checkbox"
                  checked={activeLayers.has('layer-MC2')}
                  onChange={() => toggleLayers('layer-MC2')}
                  className="rounder border-grey-300"
                />
                <span className="text-sm"><pre>Subdivision Color Coding</pre></span>
              </label>
              <label className="flex items center space-x-2">
                <input
                  type="checkbox"
                  checked={activeLayers.has('layer-MC1')}
                  onChange={() => toggleLayers('layer-MC1')}
                  className="rounder border-grey-300"
                />
                <span className="text-sm"><pre>Yellow Mask</pre></span>
              </label>
              <label className="flex items center space-x-2">
                <input
                  type="checkbox"
                  checked={activeLayers.has('layer-MC0')}
                  onChange={() => toggleLayers('layer-MC0')}
                  className="rounder border-grey-300"
                />
                <span className="text-sm"><pre>Physical Coordinates</pre></span>
              </label>
            </div>
          </div>
        </div>}
        {activeTab === "tab2" && <div className="h-full overflow-y-auto">
          
          <RegionInfo selectedRegion={selectedText}/>
          

        </div>}
      </div>
    </div>
    </div>
  );
};

export default RightInfoPanel;