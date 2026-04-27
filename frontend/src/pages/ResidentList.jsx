import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Users, Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { residentApi } from "@/lib/api";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  // ── Fetch residents ──────────────────────────────────────────────────────────
  const fetchResidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await residentApi.getAll({
        search: searchParams.get("search") || "",
        page: currentPage,
      });
      if (response.data.success) {
        const { data, current_page, last_page, total } = response.data.data;
        setResidents(data);
        setPagination({
          currentPage: current_page,
          lastPage: last_page,
          total,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load resident data.");
    } finally {
      setLoading(false);
    }
  }, [searchParams, currentPage]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  // ── Search ────────────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    params.set("page", "1");
    setSearchParams(params);
  };

  // ── Pagination ────────────────────────────────────────────────────────────────
  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    setSearchParams(params);
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
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
      toast.error(
        err.response?.data?.message || "Failed to delete resident."
      );
    } finally {
      setDeleting(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const getCurrentHouse = (item) => {
    const active = (item.house_residents || []).find(
      (hr) => hr.is_active === true || hr.is_active === 1
    );
    if (active) {
      return active.house?.house_number || active.house_number || "-";
    }
    return "-";
  };

  const renderPaginationButtons = () => {
    const { currentPage, lastPage } = pagination;
    const pages = [];

    pages.push(1);
    if (currentPage > 3) pages.push("...");

    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(lastPage - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }

    if (currentPage < lastPage - 2) pages.push("...");
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
          variant={page === currentPage ? "default" : "outline"}
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
        <Button render={<Link to="/residents/create" />}>
          <Plus />
          Add Resident
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

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
            ) : residents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48">
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <Users className="size-12 text-muted-foreground/50" />
                    <p className="font-medium text-muted-foreground">
                      No residents found
                    </p>
                    <p className="text-sm text-muted-foreground/70">
                      {searchParams.get("search")
                        ? "Try changing your search keywords."
                        : "Start by adding a new resident."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              residents.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">
                    {(pagination.currentPage - 1) * 10 + index + 1}
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
                      variant={
                        item.marital_status ? "default" : "secondary"
                      }
                    >
                      {item.marital_status ? "Married" : "Single"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getCurrentHouse(item)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        render={<Link to={`/residents/${item.id}/edit`} />}
                      >
                        <Pencil />
                        <span className="sr-only">Edit</span>
                      </Button>
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
        {!loading && pagination.lastPage > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t px-4 py-3 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Page{" "}
              <span className="font-medium text-foreground">
                {pagination.currentPage}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {pagination.lastPage}
              </span>{" "}
              ({pagination.total} records)
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
              >
                Previous
              </Button>
              {renderPaginationButtons()}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.lastPage}
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
              ? This action cannot be undone.
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
