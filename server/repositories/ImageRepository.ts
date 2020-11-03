import { ID } from "../tools/types";
import { Image } from "../models/Image";

export interface ImageShield {
  _id?: ID;
  url: string;
  book: ID;
  role: string;
}

export async function createImageShield(url: string, role: string, id: ID) {
  // get previous shield if exits
  const previousImageShield = await Image.findOne({ url: url });
  if (previousImageShield) return;

  const imageShield = new Image({
    url: url,
    role: role,
  });
  imageShield[role] = id;

  imageShield.save((err) => {
    if (err) console.error("Impossible de créer le shield", err);
  });
}

export async function getImageShield(url): Promise<ImageShield | null> {
  const imageShield = await Image.findOne({ url });
  if (!imageShield) return null;
  return {
    url: imageShield.url,
    // @ts-ignore
    book: imageShield.book,
    role: imageShield.role,
  };
}

export async function getImageShieldsFormBook(book) {
  const images = await Image.find({book});
  return images.map(i => ({ _id: i._id, url: i.url, book: i.book, role: i.role }));
}

export async function deleteShieldFromUrl(url) {
    await Image.deleteOne({url});
}
