import { useState, useMemo } from "react";
import Filters from "./Filters";
import StatusFilters from "./StatusFilters";
import TypeFilters from "./TypeFilters";
import SupertypeFilters from "./SupertypeFilters";
import OwnerFilters from "./OwnerFilters";

function FilterGroup({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden space-y-2" id="fs">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex justify-between items-center px-4 py-3 text-white"
      >
        <span className="font-semibold">{title}</span>
        <span className="text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="p-3 border-t border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
}

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
  setSortBy,
  collectionUsers,
  currentUserEmail,
  selectedOwnerEmails,
  setSelectedOwnerEmails
}) {
  const [open, setOpen] = useState(false);

  const activeCount = useMemo(() => {
    let count = 0;

    if (setFilter !== "master") count++;
    if (statusFilter !== "all") count++;
    if (typeFilter.length > 0) count++;
    if (supertypeFilter.length > 0) count++;
    if (legalOnly) count++;

    return count;
  }, [setFilter, statusFilter, typeFilter, supertypeFilter, legalOnly]);

  const clearFilters = () => {
    setSetFilter("master");
    setStatusFilter("all");
    setTypeFilter([]);
    setSupertypeFilter([]);
    setLegalOnly(false);
    setSearchQuery("");
    setSortBy("number");
  };

  return (
    <div className="sticky top-0 z-20 bg-gray-800 border-b border-gray-800 shadow-lg">
      {/* Search + sort */}
      <div className="p-3 space-y-3">
        <input
          type="text"
          placeholder="Search name or #..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-xl bg-gray-500 border border-gray-700 text-white placeholder-gray-400 outline-none focus:border-blue-500"
        />

        <div className="flex gap-2 overflow-x-auto pb-1">
          {["number", "name", "owned"].map(option => (
            <button
              type="button"
              key={option}
              onClick={() => setSortBy(option)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                sortBy === option
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 border border-gray-700"
              }`}
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main filter toggle */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="w-full relative px-4 py-3 bg-gray-900 border-t border-gray-800 text-white"
      >
        <div className="flex justify-center items-center gap-2">
          <span className="font-bold">Filters</span>

          {activeCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}

          <span>{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="p-3 space-y-3 bg-gray-950">

          <FilterGroup title="Main" defaultOpen>
            <Filters
              setCode={collection?.rule}
              current={setFilter}
              onChange={setSetFilter}
            />
            <StatusFilters
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          </FilterGroup>

          <FilterGroup title="Owners">
            <OwnerFilters
              collectionUsers={collectionUsers}
              currentUserEmail={currentUserEmail}
              selectedOwnerEmails={selectedOwnerEmails}
              setSelectedOwnerEmails={setSelectedOwnerEmails}
            />
          </FilterGroup>

          <FilterGroup title="Additional">
            <TypeFilters
              selected={typeFilter}
              onChange={setTypeFilter}
            />
            <SupertypeFilters
              selected={supertypeFilter}
              onChange={setSupertypeFilter}
            />
            <button
              type="button"
              onClick={() => setLegalOnly(prev => !prev)}
              className={`px-4 py-2 rounded-full font-semibold ${
                legalOnly
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              Legal Only
            </button>
          </FilterGroup>
          <div className="flex justify-end w-full">
            <p
              type="button"
              onClick={clearFilters}
              className="text-md text-white px-4 py-2 bg-tranparent rounded-full font-semibold"
            >
              Clear Filters
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
