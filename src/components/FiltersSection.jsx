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
  setLegalOnly
}) {
  const [open, setOpen] = useState(true);

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
    <div className="sticky top-0 z-50 bg-gray-900 border-b border-gray-700">
      
      {/* HEADER */}
      <div
        onClick={() => setOpen(prev => !prev)}
        className="cursor-pointer p-3 flex justify-between items-center bg-gray-800"
      >
        <div className="flex items-center gap-2">
          <span className="font-bold">Filters</span>

          {/* ACTIVE COUNT BADGE */}
          {activeCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </div>

        <span>{open ? "▲" : "▼"}</span>
      </div>

      {/* CONTENT */}
      {open && (
        <div className="p-3 space-y-4">

          {/* CLEAR BUTTON */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">
              Active Filters: {activeCount}
            </span>

            <button
              onClick={clearFilters}
              className="text-sm px-3 py-1 bg-red-600 rounded"
            >
              Clear All
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
          <button
            onClick={() => setLegalOnly(prev => !prev)}
            className={`px-3 py-1 rounded ${
              legalOnly ? "bg-yellow-500 text-black" : "bg-gray-700"
            }`}
          >
            Legal Only
          </button>

        </div>
      )}
    </div>
  );
}
