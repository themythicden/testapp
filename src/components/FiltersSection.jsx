import { useState, useMemo } from "react";
import Filters from "./Filters";
import StatusFilters from "./StatusFilters";
import TypeFilters from "./TypeFilters";
import SupertypeFilters from "./SupertypeFilters";

export default function FiltersSection({
  collection,
  setFilter,
  setSetFilter,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  supertypeFilter,
  setSupertypeFilter,
  legalOnly,
  setLegalOnly,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy
}) {
  const [open, setOpen] = useState(false);

  // ✅ ACTIVE FILTER COUNT
  const activeCount = useMemo(() => {
    let count = 0;

    if (setFilter !== "master") count++; // default
    if (statusFilter !== "all") count++;
    if (typeFilter.length > 0) count++;
    if (supertypeFilter.length > 0) count++;
    if (legalOnly) count++;

    return count;
  }, [setFilter, statusFilter, typeFilter, supertypeFilter, legalOnly]);

  // ✅ CLEAR ALL
  const clearFilters = () => {
    setSetFilter("master");
    setStatusFilter("all");
    setTypeFilter([]);
    setSupertypeFilter([]);
    setLegalOnly(false);
  };

  return (
    <div className="sticky top-0 z-20 bg-gray-900 border-b border-gray-700">
      <div id='searchbar' className='w-full flex'>
        {/* SEARCH BAR */}
        <input
          type="text"
          placeholder="Search name or #..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
        />
        
        {/* SORTING */}
        <div className="flex gap-2">
          {["number", "name", "owned"].map(option => (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              className={`px-3 py-1 rounded ${
                sortBy === option
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {/* HEADER */}
      <div
        onClick={() => setOpen(prev => !prev)}
        className="cursor-pointer p-3 flex justify-between items-center bg-gray-800"
      >
        <div className="flex items-center gap-2 text-white">
          <span className="font-bold">Filters</span>

          {/* ACTIVE COUNT BADGE */}
          {activeCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </div>

        <span className="text-white">{open ? "▲" : "▼"}</span>
      </div>

      {/* CONTENT */}
      {open && (
        <div className="space-y-1">

          {/* CLEAR BUTTON */}
          <div className="flex justify-between items-center">

            <button
              onClick={clearFilters}
              className="text-sm text-white px-3 py-1 bg-red-600 rounded"
            >
              Clear Filters
            </button>
          </div>

          {/* SET FILTER */}
          <Filters
            setCode={collection?.rule}
            current={setFilter}
            onChange={setSetFilter}
          />

          {/* STATUS */}
          <StatusFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />

          {/* TYPES */}
          <TypeFilters
            selected={typeFilter}
            onChange={setTypeFilter}
          />

          {/* SUPERTYPE */}
          <SupertypeFilters
            selected={supertypeFilter}
            onChange={setSupertypeFilter}
          />

          {/* LEGAL */}
          <div className="w-full bg-cyan-700">
            <button
              onClick={() => setLegalOnly(prev => !prev)}
              className={`px-3 py-1 rounded ${
                legalOnly ? "bg-yellow-500 text-white" : "bg-gray-600"
              }`}
            >
              Legal Only
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
