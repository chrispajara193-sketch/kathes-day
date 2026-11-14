const BIRTHDAY_CONFIG = {
  celebrantName: "Kathe",
  tagline: "✨ Celebrating Another Year of Magic ✨",
  birthdayDate: "November 22, 2026",
  heroSubtitle: "Wishing the happiest of birthdays to the brightest star in the room. May your year ahead sparkle as brightly as you do!",

  letterTitle: "A Special Note For You",
  letterBody: [
    "Happy Birthday, Kathe! Today is all about celebrating your kindness, your laughter, and all the wonderful memories we share.",
    "May this new chapter bring you endless joy, late-night laughs, dreams coming true, and everything your heart desires.",
    "Keep shining, keep glowing, and never stop being amazing. Cheers to you!"
  ],
  letterSignature: "With all my love, Always ♡",

  // ------------------------------------------------------------------
  // 1. ADD BIRTHDAY VIDEO GREETINGS MANUALLY HERE (SHOWN ABOVE PHOTOS)
  // ------------------------------------------------------------------
  videos: [
    {
      url: "https://drive.google.com/file/d/1mt88lH-0hGUjpK2k9u18gz58ja90-JF2/view?usp=sharing",
      caption: "Happy Birthday Ate! 🎂✨",
      date: "From: Raprap"
    },
    {
      url: "", // Paste your YouTube, Google Drive, or .mp4 greeting link here
      caption: "A special birthday wish just for you 🎥💖",
      date: "Birthday Greeting"
    }
  ],

  // ------------------------------------------------------------------
  // 2. ADD YOUR PHOTOS MANUALLY HERE (SHOWN BELOW VIDEO GREETINGS)
  // ------------------------------------------------------------------
  photos: [
    {
      url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&q=80",
      caption: "Sparkles & Birthday Vibes ✨",
      date: "Favorite Moment"
    },
    {
      url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=900&q=80",
      caption: "Midnight skies & endless laughs 🥂",
      date: "Special Night"
    },
    {
      url: "https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=900&q=80",
      caption: "Sweetest memories together 💖",
      date: "Throwback"
    },
    {
      url: "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?auto=format&fit=crop&w=900&q=80",
      caption: "Cheers to another fabulous year! 🎂",
      date: "Birthday Cake"
    }
  ]
};

module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(BIRTHDAY_CONFIG);
};
