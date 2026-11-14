const BIRTHDAY_CONFIG = {
  celebrantName: "Kathe",
  tagline: "✨ Celebrating Another Year of Magic ✨",
  birthdayDate: "November 22, 2026",
  heroSubtitle: "Wishing the happiest of birthdays to the brightest star in the room. May your year ahead sparkle as brightly as you do!",

  letterTitle: "A Special Note For You",
  letterBody: [
    "Hi love! Happy, happy birthday to the loveliest, kindest, most caring, and beautiful girl I've ever known. I hope you never forget how special you are and how much you deserve all the happiness in this world.",
    "I hope you enjoy your day and feel how loved and appreciated you are.",
    "Sana magustuhan mo itong simple gift ko, because it's given with all my heart. Always remember that I'm here for you, through the good days and even the difficult ones. I'll always be here to support you, appreciate you, and remind you how wonderful you are. I love you so much, and I miss you. Enjoy your special day, love!"
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
      url: "https://drive.google.com/file/d/1NajEGCGXZyOKLpgH0hvIeHfK9680GK9V/view?usp=sharing",
      caption: "Happy Birthday ate kathe 🎥💖",
      date: "From: Dandan"
    },
    {
      url: "https://drive.google.com/file/d/1TMBM8IVREkwE1O7nb78isz2ykioXRG3K/view?usp=sharing",
      caption: "Happy Birthday ate kathe 🎥💖",
      date: "From: Chloe"
    }
  ],

  // ------------------------------------------------------------------
  // 2. ADD YOUR PHOTOS MANUALLY HERE (SHOWN BELOW VIDEO GREETINGS)
  // ------------------------------------------------------------------
  photos: [
    {
      url: "https://drive.google.com/file/d/1iPxmFWVrwg00GU0Tl0m_aX-JMjlGBtr0/view?usp=sharing",
      caption: "Sparkle Vibes ✨",
      date: "Favorite Moment"
    },
    {
      url: "https://drive.google.com/file/d/163Pltkhzoti0Lmxilt8tQxm3hWxZE6Dj/view?usp=sharing",
      caption: "Midnight skies & endless laughs 🥂",
      date: "Special Night"
    },
    {
      url: "https://drive.google.com/file/d/1dB3jh66LexaIuRwKTg0Ov0Z-HMTVg-vM/view?usp=sharing",
      caption: "Sweetest memories together 💖",
      date: "Throwback"
    },
    {
      url: "https://drive.google.com/file/d/17rJuFkV2gAXWyZkeVWmRg5HBrCZ-84E7/view?usp=sharing",
      caption: "Cheers to another fabulous year! 🎂",
      date: "Birthday Cake"
    },
    {
      url: "https://drive.google.com/file/d/1wJcTDwyQEQIs3WiA3JIFRbjcjN6cL9Xk/view?usp=sharing",
      caption: "Sweetest memories together 💖",
      date: "Throwback"
    },
    {
      url: "https://drive.google.com/file/d/1f6lvAedH7BwzGne6MbOnsIrVN9KmsfZp/view?usp=sharing",
      caption: "Sweetest memories together 💖",
      date: "Throwback"
    },
    {
      url: "https://drive.google.com/file/d/1LzfIx0MRemwVOHwobyTVyvrZWuZWQa2x/view?usp=sharing",
      caption: "Sweetest memories together 💖",
      date: "Throwback"
    },
    {
      url: "https://drive.google.com/file/d/1tJW7JfQr4VGBLIKrEYocqnyv47sSR1FZ/view?usp=sharing",
      caption: "Sweetest memories together 💖",
      date: "Throwback"
    },
    {
      url: "https://drive.google.com/file/d/1dMkkebg1L--5uhZLSWYWL2y-AQt3IbaN/view?usp=sharing",
      caption: "Sweetest memories together 💖",
      date: "Throwback"
    },
    {
      url: "https://drive.google.com/file/d/18EGoCXYTx8-cMp0tl8xdZWoIA2pEbiv-/view?usp=sharing",
      caption: "With Thea",
      date: "Throwback Literal"
    }    
  ]
};

module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(BIRTHDAY_CONFIG);
};
