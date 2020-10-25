import { Book } from "../models/Book";
import { Page, PageDocument } from "../models/Page";
import {
  RESOURCE_NOT_FOUND,
  SERVER_ERROR,
  UNAUTHORIZE,
} from "../tools/ErrorTypes";
import { ID } from "../tools/types";
import { bookDocumentToBookInterface, BookInterface } from "./BookRepository";
import { userDocumentToUserInterface, UserInterface } from "./UserRepository";

export interface PageInterface {
  _id: ID;
  mainAuthor: UserInterface;
  lastAuthor: UserInterface;
  title: string;
  content: string;
  location: Location;
  images: Array<string>;
  book: BookInterface;
  created?: Date;
  updated?: Date | number;
}

export interface Location {
  lat: number;
  lng: number;
  label: string;
  country: string;
}

function pageDocumentToPageInterface(
  pageDocument: PageDocument | string
): PageInterface {
  if (typeof pageDocument == "string") return;
  return {
    _id: pageDocument._id,
    mainAuthor: userDocumentToUserInterface(pageDocument.mainAuthor),
    lastAuthor: userDocumentToUserInterface(pageDocument.lastAuthor),
    title: pageDocument.title,
    content: pageDocument.content,
    location: pageDocument.location,
    images: pageDocument.images,
    book: bookDocumentToBookInterface(pageDocument.book),
    created: pageDocument.created,
    updated: pageDocument.updated,
  };
}

/**
 * Create a page if the user can
 * @param currentUser the creator of the page
 * @param bookId book containing the page
 * @param title title of the page
 * @param content text of the page
 * @param images list of the page images
 * @param location location of the page
 */
export async function createPage(
  currentUser: ID,
  bookId: ID,
  title: string,
  content: string,
  images: string[],
  location: Location
): Promise<PageInterface> {
  const book = await Book.findById(bookId);

  if (!book.hasAccess(currentUser)) throw new Error(UNAUTHORIZE);

  // Create the page
  try {
    const newPage = await Page.create({
      mainAuthor: currentUser,
      lastAuthor: currentUser,
      title,
      content,
      location,
      images,
      book: bookId,
      created: Date.now(),
      updated: Date.now(),
    });
    return pageDocumentToPageInterface(newPage);
  } catch {
    throw new Error(SERVER_ERROR);
  }
}

/**
 * Update a page
 * @param bookId id of the book containeig the page to update
 * @param pageId id of the page to update
 * @param currentUser currentusert to control rights  and update the last modifier
 * @param title new title
 * @param content new content
 * @param images new list of images
 * @param locations new location
 */
export async function updatePage(
  bookId: ID,
  pageId: ID,
  currentUser: ID,
  title: string,
  content: string,
  images: string[],
  locations: Location
): Promise<PageInterface> {
  const page = await Page.findOne({ book: bookId, _id: pageId }).populate(
    "book"
  );

  if (!page) throw Error(RESOURCE_NOT_FOUND);

  //@ts-ignore
  if (!page.book.hasAccess(currentUser)) throw Error(UNAUTHORIZE);

  page.title = title;
  page.content = content;
  page.images = images;
  //@ts-ignore
  page.location = location;
  page.updated = Date.now();
  page.lastAuthor = currentUser;

  try {
    const savedPage = await page.save();
    return pageDocumentToPageInterface(savedPage);
  } catch {
    throw Error(SERVER_ERROR);
  }
}

/**
 * Delete a page
 * @param bookId book containing the page tho check the rights
 * @param pageId page to delete
 * @param currentUser user to check the rights
 */
export async function deletePage(
  bookId: ID,
  pageId: ID,
  currentUser: ID
): Promise<PageInterface> {
  // Get page
  const page = await Page.findOne({ book: bookId, _id: pageId }).populate(
    "book"
  );
  if (!page) throw Error(RESOURCE_NOT_FOUND);

  // Check authorisation
  // @ts-ignore
  if (!page.isMainAuthor(currentUser) && !page.book.isMainAuthor(currentUser))
    throw Error(UNAUTHORIZE);

  // delete the page
  try {
    await Page.deleteOne({ _id: pageId });
    return pageDocumentToPageInterface(page);
  } catch {
    throw Error(SERVER_ERROR);
  }
}

/**
 * Get pages form a book
 * @param bookId book containing the pages
 * @param currentUser current user for the rights
 */
export async function getPages(bookId: ID, currentUser: ID) {
  const book = await Book.findOne({ _id: bookId });

  if (!book) throw Error(RESOURCE_NOT_FOUND);
  if (!book.hasAccess(currentUser) && !book.public) throw Error(UNAUTHORIZE);

  const pages = await Page.find({ book: book });

  const pagesFormated = pages.map((p) => pageDocumentToPageInterface(p));

  return pagesFormated;
}


/**
 * Get a page from its id and its bookId
 * @param bookId id of the book containing the page
 * @param pageId id of the page
 * @param currentUser current user id for the rights
 */
export async function getPageById(bookId: ID, pageId: ID, currentUser: ID) {
  const page = await (
    await Page.findOne({ book: bookId, _id: pageId })
  ).populated("book");

  if (!page) return null;

  if (!page.book.hasAccess(currentUser) && !page.book.public)
    throw Error(UNAUTHORIZE);
  
    return page;
}
