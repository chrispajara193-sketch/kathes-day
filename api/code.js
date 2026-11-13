const BIRTHDAY_CONFIG = {
  celebrantName: "Kathe",
  tagline: "✨ Celebrating Another Year of Magic ✨",
  birthdayDate: "November 13, 2026",
  heroSubtitle: "Wishing the happiest of birthdays to the brightest star in the room. May your year ahead sparkle as brightly as you do!",

  letterTitle: "A Special Note For You",
  letterBody: [
    "Happy Birthday, Kathe! Today is all about celebrating your kindness, your laughter, and all the wonderful memories we share.",
    "May this new chapter bring you endless joy, late-night laughs, dreams coming true, and everything your heart desires.",
    "Keep shining, keep glowing, and never stop being amazing. Cheers to you!"
  ],
  letterSignature: "With all my love, Always ♡",

  media: [
    {
      type: "photo",
      url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&q=80",
      caption: "Sparkles & Birthday Vibes ✨",
      date: "Favorite Moment"
    },
    {
      type: "photo",
      url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=900&q=80",
      caption: "Midnight skies & endless laughs 🥂",
      date: "Special Night"
    },
    {
      type: "video",
      url: "https://assets.mixkit.co/videos/preview/mixkit-woman-blowing-sparklers-at-night-41918-large.mp4",
      caption: "Make a wish under the stars 🎆",
      date: "Celebration Clip"
    },
    {
      type: "photo",
      url: "https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=900&q=80",
      caption: "Sweetest memories together 💖",
      date: "Throwback"
    },
    {
      type: "video",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      caption: "Our favorite highlight reel 🎥",
      date: "Video Memory"
    },
    {
      type: "photo",
      url: "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?auto=format&fit=crop&w=900&q=80",
      caption: "Cheers to another fabulous year! 🎂",
      date: "Birthday Cake"
    }
  ]
};

// Vercel Serverless Function Handler (CommonJS — no package.json needed)
module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(BIRTHDAY_CONFIG);
};
