import { useState } from "react";
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

  return (
    <div className="sticky top-0 z-50 bg-gray-900 border-b border-gray-700">
      
      {/* HEADER TOGGLE */}
      <div
        onClick={() => setOpen(prev => !prev)}
        className="cursor-pointer p-3 flex justify-between items-center bg-gray-800"
      >
        <span className="font-bold">Filters</span>
        <span>{open ? "▲" : "▼"}</span>
      </div>

      {/* CONTENT */}
      {open && (
        <div className="p-3 space-y-4">

          {/* SET FILTERS */}
          <Filters
            setCode={collection?.rule}
            current={setFilter}
            onChange={setSetFilter}
          />

          {/* STATUS FILTERS */}
          <StatusFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />

          {/* TYPE FILTERS */}
          <TypeFilters
            selected={typeFilter}
            onChange={setTypeFilter}
          />

          {/* SUPERTYPE FILTERS */}
          <SupertypeFilters
            selected={supertypeFilter}
            onChange={setSupertypeFilter}
          />

          {/* LEGAL TOGGLE */}
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
