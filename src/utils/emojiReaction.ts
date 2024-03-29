interface Emoji {
  title: string;
  image: string;
}

export const emojisReactions: Emoji[] = [
  {
    title: "cool",
    image: "😎",
  },
  {
    title: "heartInEyes",
    image: "😍",
  },
  {
    title: "cry",
    image: "😭",
  },
  {
    title: "thumbUp",
    image: "👍",
  },
  {
    title: "thumbDown",
    image: "👎",
  },
  {
    title: "laugh",
    image: "😂",
  },
  {
    title: "party",
    image: "🎉",
  },
  {
    title: "thinking",
    image: "🤔",
  },
  {
    title: "clap",
    image: "👏",
  },
  {
    title: "surprise",
    image: "😳",
  },
];

// Map of emoji titles to Unicode characters
const emojiMap: { [key: string]: string } = {};
emojisReactions.forEach((emoji) => {
  emojiMap[emoji.title] = emoji.image;
});

export function convertShortcodeToUnicode(shortcode: string): string {
  // Check if the shortcode exists in the emoji map
  if (emojiMap.hasOwnProperty(shortcode)) {
    return emojiMap[shortcode];
  } else {
    // If shortcode is not found, return the original shortcode
    return shortcode;
  }
}

export default emojisReactions;
