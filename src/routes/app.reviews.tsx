import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Star, Pencil, Trash2, MessageSquare, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReviewRatings, updateReviewRating, deleteReviewRating } from "@/core/db/supabase-queries";
import { useTenantContext } from "@/features/tenant/hooks/useTenantContext";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { toast } from "sonner";
import { Label } from "@/shared/components/ui/label";

export const Route = createFileRoute("/app/reviews")({
  head: () => ({ meta: [{ title: "My Reviews — HomeSure" }] }),
  component: ReviewsPage,
});

function ReviewsPage() {
  const tenantContext = useTenantContext();
  const tenantId = tenantContext.tenantId;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [editingReview, setEditingReview] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editRating, setEditRating] = useState(5);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["tenant-reviews", tenantId],
    queryFn: () => getReviewRatings(tenantId!),
    enabled: !!tenantId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => updateReviewRating(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-reviews"] });
      toast.success("Review updated successfully");
      setEditingReview(null);
    },
    onError: (err: any) => toast.error("Error updating review: " + err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteReviewRating(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-reviews"] });
      toast.success("Review deleted successfully");
    },
    onError: (err: any) => toast.error("Error deleting review: " + err.message)
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    updateMutation.mutate({
      id: editingReview.review_id,
      payload: {
        review_title: editTitle,
        review_description: editDesc,
        rating: editRating
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this review?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredReviews = reviews.filter((r: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.review_title || "").toLowerCase().includes(q) ||
      (r.review_description || "").toLowerCase().includes(q)
    );
  });

  if (!tenantId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Please complete your tenant profile to view reviews.
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} />
    ));
  };

  return (
    <div className="space-y-6 pb-12 overflow-x-hidden">
      <PageHeader
        title="My Reviews"
        description="Manage your reviews and ratings for properties."
      />

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search reviews..." 
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <span className="text-muted-foreground">Loading reviews...</span>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center p-12 bg-card rounded-xl border border-dashed border-border/60">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-3" />
          <h3 className="text-lg font-medium text-foreground">No reviews found</h3>
          <p className="text-muted-foreground mt-1 max-w-md mx-auto">
            {search ? "No reviews match your search." : "You haven't written any reviews yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredReviews.map((review: any) => (
            <Card key={review.review_id} className="relative group">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{review.review_title}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      {renderStars(review.rating || 5)}
                      <span className="text-xs text-muted-foreground ml-2">{review.review_date}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => {
                      setEditingReview(review);
                      setEditTitle(review.review_title || "");
                      setEditDesc(review.review_description || "");
                      setEditRating(review.rating || 5);
                    }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(review.review_id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed bg-muted/30 p-3 rounded-md border border-border/40">
                  {review.review_description || "No description provided."}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editingReview} onOpenChange={(open) => !open && setEditingReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <Button
                    key={num}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto"
                    onClick={() => setEditRating(num)}
                  >
                    <Star className={`h-6 w-6 ${num <= editRating ? "fill-amber-400 text-amber-400" : "text-muted fill-muted"}`} />
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={editDesc} 
                onChange={(e) => setEditDesc(e.target.value)} 
                rows={4}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingReview(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
