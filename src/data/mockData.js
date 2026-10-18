export const INITIAL_SUGGESTIONS = [
  "female photographer for my wedding in S.F",
  "cheap photographer under US$30",
  "portrait photographer in Paris",
  "vintage film photographer"
];

export const PHOTOGRAPHERS_DATA = [
  {
    id: "sophia-anderson",
    name: "Sophia Anderson",
    price: "From US$120",
    rating: 4.9,
    reviewsCount: 84,
    tags: ["Wedding", "Romantic", "Golden Hour"],
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    fallbackImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
    location: "San Francisco, CA",
    experience: "7+ years",
    bio: "Passionate visual storyteller specializing in intimate weddings, natural light, and authentic emotional moments throughout the Bay Area."
  },
  {
    id: "emma-thompson",
    name: "Emma Thompson",
    price: "From US$150",
    rating: 5.0,
    reviewsCount: 112,
    tags: ["Editorial", "Fine Art", "Outdoor"],
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
    fallbackImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
    location: "San Francisco & Napa Valley",
    experience: "9 years",
    bio: "Capturing cinematic love stories with warm tones and documentary precision. Featured in Vogue Weddings and Style Me Pretty."
  },
  {
    id: "emma-davis",
    name: "Emma Davis",
    price: "From US$130",
    rating: 4.8,
    reviewsCount: 67,
    tags: ["Candid", "Modern", "Elopements"],
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    fallbackImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
    location: "Oakland & San Francisco",
    experience: "5 years",
    bio: "Specializing in joyous, heartfelt celebrations. My goal is to make you feel completely relaxed in front of the lens."
  },
  {
    id: "clara-valentin",
    name: "Clara Valentin",
    price: "From US$140",
    rating: 4.9,
    reviewsCount: 52,
    tags: ["Film & Digital", "Boho", "Portraits"],
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
    fallbackImage: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80",
    location: "San Francisco, CA",
    experience: "6 years",
    bio: "Merging timeless 35mm film aesthetic with sharp digital photography for breathtaking heirloom wedding albums."
  }
];

export const DEFAULT_AI_RESPONSE = {
  header: "Results",
  message: "Got it! These top picks in SF are all experienced female photographers who know how to capture love stories beautifully.",
  items: PHOTOGRAPHERS_DATA,
  footerMessage: "Hope one of these photographers captures your love story perfectly! Let me know if you need anything else 😊"
};
