import { siteConfig } from "@/lib/site-config"
import { verifiedReviews, getInitials } from "@/lib/reviews"
import { Reveal, Stagger, StaggerItem, CountUp } from "@/components/motion/motion-primitives"

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < rating ? "text-primary" : "text-muted-foreground/30"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden
        >
          <path d="M9.05 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 0 0-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118l-3.366-2.446a1 1 0 0 0-1.176 0l-3.366 2.446c-.784.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 0 0-.364-1.118L2.353 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.958Z" />
        </svg>
      ))}
    </div>
  )
}

export function Reviews({ showHeading = true }: { showHeading?: boolean }) {
  // Show the first 6 verified reviews; the 7th is retained in data for rotation.
  const reviews = verifiedReviews.slice(0, 6)

  // The shop's overall Google rating across 50+ verified reviews; we display a
  // representative handful here since we can't show them all.
  const averageRating = 4.9
  const reviewCount = 50

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4">
        {showHeading && (
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Real Google Reviews</p>
            <h2 className="mt-2 text-balance text-3xl font-bold text-foreground md:text-4xl">
              What Our Customers Say
            </h2>
            <div className="mt-6 flex items-center justify-center gap-8">
              <div>
                <p className="text-3xl font-bold text-foreground">
                  <CountUp value={averageRating} decimals={1} />
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Average rating</p>
              </div>
              <div className="h-10 w-px bg-border" aria-hidden />
              <div>
                <p className="text-3xl font-bold text-foreground">
                  <CountUp value={reviewCount} suffix="+" />
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Verified reviews
                </p>
              </div>
            </div>
          </Reveal>
        )}

        <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, i) => (
            <StaggerItem key={i} className="h-full">
              <figure className="flex h-full flex-col rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
                  aria-hidden
                >
                  {getInitials(review.author)}
                </div>
                <div className="min-w-0">
                  <figcaption className="truncate text-sm font-semibold text-foreground">{review.author}</figcaption>
                  <Stars rating={review.rating} />
                </div>
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
                &ldquo;{review.text}&rdquo;
              </blockquote>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
                  />
                </svg>
                  Posted on Google
                </div>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mt-10 text-center">
          <a
            href={siteConfig.social.googleReviews}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 active:scale-[0.98]"
          >
            Read All Reviews on Google
          </a>
        </div>
      </div>
    </section>
  )
}
