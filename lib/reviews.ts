// Verified Google reviews for Hub Tire Shop.
// Reviewer names are kept exactly as supplied. The original reviews were left in
// Spanish by customers and have been translated to English for display.
// No owner responses and no fabricated profile photos are stored; cards use initials.

export type Review = {
  author: string
  rating: number
  text: string
}

// All verified reviews. The homepage/reviews sections display the first 6;
// the 7th is retained here for rotation.
export const verifiedReviews: Review[] = [
  {
    author: "Jorge Alberto Gómez Hurtado",
    rating: 5,
    text: "Excellent service, attended to by the owner himself and the best advice. Recommended 10/10",
  },
  {
    author: "valuherrero",
    rating: 5,
    text: "Excellent service! I was very happy with the attention they gave me and how my car turned out — other places had never left it like this. Highly recommended",
  },
  {
    author: "José Francisco Astudillo Espinoza",
    rating: 5,
    text: "Excellent service, quality and personalized attention. You can tell they know what they're doing — totally recommended! Thank you so much for everything",
  },
  {
    author: "Vanesa Dimarco",
    rating: 5,
    text: "Thank you so much for taking such good care of me — impeccable service, excellent cleaning, everything perfect. Honestly it exceeded my expectations. I recommend them 100% and the best price too, without a doubt they're the best. Thank you, thank you, thank you",
  },
  {
    author: "Jessica Abran",
    rating: 5,
    text: "Very good experience, excellent customer service! The car was impeccable in every way! Thank you so much, best of luck!!!",
  },
  {
    author: "Charly",
    rating: 5,
    text: "Excellent service. They helped me with a tire change and a repair at a very good price. Highly recommended!",
  },
  {
    author: "Florencia Martinez",
    rating: 5,
    text: "Thank you so much!!!! They did an excellent job and I was very satisfied. I'll definitely bring my car back another time",
  },
]

// Derive up-to-two-letter initials from a reviewer name for avatar fallbacks.
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
