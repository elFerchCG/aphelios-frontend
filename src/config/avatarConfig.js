import meme03 from "../images/avatars/meme_03.png";
import meme04 from "../images/avatars/meme_04.png";
import meme05 from "../images/avatars/meme_05.png";

export const avatarOptions = [
  {
    key: "meme_03",
    name: "Gato enojado",
    image: meme03,
  },
  {
    key: "meme_04",
    name: "Gorila",
    image: meme04,
  },
  {
    key: "meme_05",
    name: "Chill Guy",
    image: meme05,
  },
];

export const getAvatarByKey = (avatarKey) => {
  return avatarOptions.find(
    (avatar) => avatar.key === avatarKey
  );
};

export const getAvatarImage = (avatarKey) => {
  return getAvatarByKey(avatarKey)?.image || null;
};

export const getAvatarName = (avatarKey) => {
  return getAvatarByKey(avatarKey)?.name || "Sin avatar";
};