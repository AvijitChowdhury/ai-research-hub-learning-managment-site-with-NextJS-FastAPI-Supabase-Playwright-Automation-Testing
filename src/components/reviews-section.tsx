import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Trash2, Pencil } from "lucide-react";
import { fetchReviews, fetchMyReview, upsertReview, deleteMyReview } from "@/lib/reviews";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function ReviewsSection({
  courseId,
  courseTitle,
  enrolled,
  fallbackRating,
  fallbackReviewsCount,
}: {
  courseId: string;
  courseTitle: string;
  enrolled: boolean;
  fallbackRating: number;
  fallbackReviewsCount: number;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const reviewsQ = useQuery({ queryKey: ["reviews", courseId], queryFn: () => fetchReviews(courseId) });
  const mineQ = useQuery({
    queryKey: ["my-review", courseId, user?.id],
    queryFn: () => fetchMyReview(courseId),
    enabled: !!user,
  });

  const reviews = reviewsQ.data ?? [];
  const avg = reviews.length
    ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length
    : fallbackRating;
  const total = reviews.length || fallbackReviewsCount;
  const dist = [5, 4, 3, 2, 1].map((s) => {
    const count = reviews.filter((r) => r.rating === s).length;
    return { star: s, count, pct: reviews.length ? Math.round((count / reviews.length) * 100) : 0 };
  });

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="mono-label mb-4">student reviews</div>
        <div className="grid gap-6 md:grid-cols-[auto_1fr]">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-5xl">{avg.toFixed(1)}</span>
              <span className="mono-label">/ 5.00</span>
            </div>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-3.5 w-3.5 ${s <= Math.round(avg) ? "fill-signal text-signal" : "text-muted-foreground/40"}`}
                />
              ))}
            </div>
            <div className="mono-label mt-1">{total.toLocaleString()} reviews</div>
          </div>
          <div className="space-y-2">
            {dist.map((d) => (
              <div key={d.star} className="flex items-center gap-3 text-xs">
                <span className="w-6 font-mono">{d.star}★</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full bg-signal" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="w-10 text-right font-mono text-muted-foreground">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Your review */}
      {user && enrolled && (
        <ReviewComposer
          courseId={courseId}
          existing={mineQ.data ?? null}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["reviews", courseId] });
            qc.invalidateQueries({ queryKey: ["my-review", courseId] });
            qc.invalidateQueries({ queryKey: ["courses"] });
          }}
        />
      )}
      {user && !enrolled && (
        <div className="rounded-lg border border-dashed border-border bg-surface p-4 text-sm text-muted-foreground">
          Enroll in <span className="text-foreground">{courseTitle}</span> to leave a review.
        </div>
      )}
      {!user && (
        <div className="rounded-lg border border-dashed border-border bg-surface p-4 text-sm text-muted-foreground">
          Sign in and enroll to leave a review.
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-3">
        <div className="mono-label">all reviews</div>
        {reviewsQ.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!reviewsQ.isLoading && reviews.length === 0 && (
          <div className="rounded-lg border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
            No reviews yet. Be the first.
          </div>
        )}
        {reviews.map((r) => {
          const name = r.author.displayName || "Anonymous";
          const initial = name[0]?.toUpperCase() ?? "?";
          return (
            <div key={r.id} className="rounded-lg border border-border bg-surface p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-signal/20 font-mono text-sm text-signal">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm">{name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3 w-3 ${s <= r.rating ? "fill-signal text-signal" : "text-muted-foreground/40"}`}
                      />
                    ))}
                  </div>
                  {r.body && <p className="mt-3 text-sm text-muted-foreground">{r.body}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewComposer({
  courseId,
  existing,
  onSaved,
}: {
  courseId: string;
  existing: { rating: number; body: string | null } | null;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(!existing);
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(existing?.body ?? "");

  const saveMut = useMutation({
    mutationFn: () => upsertReview(courseId, rating, body),
    onSuccess: () => {
      toast.success(existing ? "Review updated." : "Review posted.");
      setEditing(false);
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: () => deleteMyReview(courseId),
    onSuccess: () => {
      toast.success("Review removed.");
      setRating(5);
      setBody("");
      setEditing(true);
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (existing && !editing) {
    return (
      <div className="rounded-lg border border-signal/30 bg-signal/5 p-5">
        <div className="mono-label mb-2 text-signal">your review</div>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-4 w-4 ${s <= existing.rating ? "fill-signal text-signal" : "text-muted-foreground/40"}`}
            />
          ))}
        </div>
        {existing.body && <p className="mt-3 text-sm text-muted-foreground">{existing.body}</p>}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-xs hover:bg-surface-2"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
          <button
            onClick={() => {
              if (confirm("Delete your review?")) delMut.mutate();
            }}
            disabled={delMut.isPending}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-xs text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="mono-label mb-2">{existing ? "edit your review" : "write a review"}</div>
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setRating(s)}
            onMouseEnter={() => setHover(s)}
            className="transition-transform hover:scale-110"
            aria-label={`${s} stars`}
          >
            <Star
              className={`h-6 w-6 ${
                s <= (hover || rating) ? "fill-signal text-signal" : "text-muted-foreground/40"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 font-mono text-xs text-muted-foreground">{rating} / 5</span>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="Share what worked, what didn't, and who this course is for…"
        className="mt-4 w-full rounded-md border border-border bg-background p-3 text-sm"
      />
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending}
          className="rounded-md bg-signal px-4 py-1.5 font-mono text-xs text-signal-foreground disabled:opacity-50"
        >
          {saveMut.isPending ? "Saving…" : existing ? "Update review" : "Post review"}
        </button>
        {existing && (
          <button
            onClick={() => {
              setEditing(false);
              setRating(existing.rating);
              setBody(existing.body ?? "");
            }}
            className="rounded-md border border-border px-4 py-1.5 font-mono text-xs"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
