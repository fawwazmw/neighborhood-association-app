import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Info,
} from "lucide-react";
import { residentApi } from "@/lib/api";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ResidentList() {
  const navigate = useNavigate();

  // ── Data & loading state ──────────────────────────────────────────────────────
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Search (debounced, local state only) ──────────────────────────────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef(null);

  // ── Column filters (client-side) ──────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState("all");
  const [maritalFilter, setMaritalFilter] = useState("all");
  const [houseFilter, setHouseFilter] = useState("all");

  // ── Pagination ────────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [serverPagination, setServerPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });

  // ── Delete state ──────────────────────────────────────────────────────────────
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Debounce search input ─────────────────────────────────────────────────────
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // reset to page 1 on new search
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  // ── Check if any column filter is active ────────────────────────────────────
  const hasFilter =
    statusFilter !== "all" || maritalFilter !== "all" || houseFilter !== "all";

  // ── Fetch residents ───────────────────────────────────────────────────────────
  // When filters active → fetch all so client-side filtering works
  // When no filters → normal server pagination (per_page=15)
  const fetchResidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { search: debouncedSearch || "" };
      if (hasFilter) {
        params.per_page = 500;
      } else {
        params.page = currentPage;
      }
      const response = await residentApi.getAll(params);
      if (response.data.success) {
        const result = response.data.data;
        const data = result.data || result;
        setResidents(Array.isArray(data) ? data : []);
        if (!hasFilter) {
          setServerPagination({
            currentPage: result.current_page || 1,
            lastPage: result.last_page || 1,
            total: result.total || 0,
          });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load resident data.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, currentPage, hasFilter]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const getActiveHouseResident = (item) =>
    (item.house_residents || []).find(
      (hr) => hr.is_active === true || hr.is_active === 1
    );

  const getCurrentHouse = (item) => {
    const active = getActiveHouseResident(item);
    if (active) {
      return active.house?.house_number || active.house_number || "-";
    }
    return "-";
  };

  // ── Client-side filtering ─────────────────────────────────────────────────────
  const filteredResidents = useMemo(() => {
    return residents.filter((item) => {
      if (statusFilter !== "all" && item.resident_status !== statusFilter)
        return false;
      if (maritalFilter === "married" && !item.marital_status) return false;
      if (maritalFilter === "single" && item.marital_status) return false;
      const hasActiveHouse = Boolean(getActiveHouseResident(item));
      if (houseFilter === "assigned" && !hasActiveHouse) return false;
      if (houseFilter === "unassigned" && hasActiveHouse) return false;
      return true;
    });
  }, [residents, statusFilter, maritalFilter, houseFilter]);

  // ── Pagination (client-side when filtered, server-side when not) ────────────
  const PER_PAGE = 10;

  let displayResidents;
  let totalRecords;
  let lastPage;
  let safePage;

  if (hasFilter) {
    // Client-side pagination on filtered data
    totalRecords = filteredResidents.length;
    lastPage = Math.max(1, Math.ceil(totalRecords / PER_PAGE));
    safePage = Math.min(currentPage, lastPage);
    displayResidents = filteredResidents.slice(
      (safePage - 1) * PER_PAGE,
      safePage * PER_PAGE
    );
  } else {
    // Server-side pagination — show what the API returned
    displayResidents = residents;
    totalRecords = serverPagination.total;
    lastPage = serverPagination.lastPage;
    safePage = serverPagination.currentPage;
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, maritalFilter, houseFilter]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // ── Delete handlers ───────────────────────────────────────────────────────────
  const handleOpenDelete = (item) => {
    setDeleteItem(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const response = await residentApi.delete(deleteItem.id);
      if (response.data.success) {
        setDeleteDialogOpen(false);
        setDeleteItem(null);
        toast.success("Resident deleted successfully");
        fetchResidents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete resident.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Pagination buttons ────────────────────────────────────────────────────────
  const renderPaginationButtons = () => {
    const pages = [];

    pages.push(1);
    if (safePage > 3) pages.push("...");

    for (
      let i = Math.max(2, safePage - 1);
      i <= Math.min(lastPage - 1, safePage + 1);
      i++
    ) {
      pages.push(i);
    }

    if (safePage < lastPage - 2) pages.push("...");
    if (lastPage > 1) pages.push(lastPage);

    return pages.map((page, idx) =>
      page === "..." ? (
        <span
          key={`ellipsis-${idx}`}
          className="px-3 py-2 text-sm text-muted-foreground"
        >
          ...
        </span>
      ) : (
        <Button
          key={page}
          variant={page === safePage ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(page)}
        >
          {page}
        </Button>
      )
    );
  };

  // ── Skeleton rows ─────────────────────────────────────────────────────────────
  const renderSkeletonRows = () =>
    Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={`skeleton-${i}`}>
        <TableCell>
          <div className="h-4 w-6 rounded bg-muted animate-pulse" />
        </TableCell>
        <TableCell>
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        </TableCell>
        <TableCell>
          <div className="h-4 w-28 rounded bg-muted animate-pulse" />
        </TableCell>
        <TableCell>
          <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
        </TableCell>
        <TableCell>
          <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
        </TableCell>
        <TableCell>
          <div className="h-4 w-12 rounded bg-muted animate-pulse" />
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-center gap-1">
            <div className="h-7 w-7 rounded bg-muted animate-pulse" />
            <div className="h-7 w-7 rounded bg-muted animate-pulse" />
          </div>
        </TableCell>
      </TableRow>
    ));

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Residents</h1>
          <p className="text-sm text-muted-foreground">
            Manage resident data
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-1.5">
          <Link to="/residents/create">
            <Button>
              <Plus />
              Add Resident
            </Button>
          </Link>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Info className="size-3" />
            To assign a resident to a house, go to the{" "}
            <Link to="/houses" className="underline underline-offset-2">
              Houses
            </Link>{" "}
            page.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="pl-8"
        />
      </div>

      {/* Column Filters */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row gap-3 py-3">
          {/* Status Filter */}
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Marital Status Filter */}
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Marital Status
            </label>
            <Select value={maritalFilter} onValueChange={setMaritalFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="single">Single</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* House Filter */}
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              House
            </label>
            <Select value={houseFilter} onValueChange={setHouseFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={fetchResidents}
            className="mt-2 text-sm font-medium text-destructive underline underline-offset-4 hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card ring-1 ring-foreground/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Marital Status</TableHead>
              <TableHead>Current House</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              renderSkeletonRows()
            ) : displayResidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48">
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <Users className="size-12 text-muted-foreground/50" />
                    <p className="font-medium text-muted-foreground">
                      No residents found
                    </p>
                    <p className="text-sm text-muted-foreground/70">
                      {search.trim() ||
                      statusFilter !== "all" ||
                      maritalFilter !== "all" ||
                      houseFilter !== "all"
                        ? "Try adjusting your search or filters."
                        : "Start by adding a new resident."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayResidents.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">
                    {(safePage - 1) * PER_PAGE + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.full_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.phone_number || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.resident_status === "permanent"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {item.resident_status === "permanent"
                        ? "Permanent"
                        : "Contract"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={item.marital_status ? "default" : "secondary"}
                    >
                      {item.marital_status ? "Married" : "Single"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getCurrentHouse(item)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Link to={`/residents/${item.id}/edit`}>
                        <Button variant="ghost" size="icon-sm">
                          <Pencil />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => handleOpenDelete(item)}
                      >
                        <Trash2 />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {!loading && lastPage > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t px-4 py-3 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Page{" "}
              <span className="font-medium text-foreground">
                {safePage}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {lastPage}
              </span>{" "}
              ({totalRecords} records)
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage <= 1}
              >
                Previous
              </Button>
              {renderPaginationButtons()}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage >= lastPage}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeleteItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resident</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete resident{" "}
              <span className="font-medium text-foreground">
                &quot;{deleteItem?.full_name}&quot;
              </span>
              ? This will also permanently delete all their house assignment
              history and payment records. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
