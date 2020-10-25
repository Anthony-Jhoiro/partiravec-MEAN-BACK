import { ID } from "../tools/types";
import { userDocumentToUserInterface, UserInterface } from "./UserRepository";
import { Book, BookDocument } from "../models/Book";
import { User } from "../models/User";
import {
  LOGIN_NEEDED,
  RESOURCE_NOT_FOUND,
  SERVER_ERROR,
  UNAUTHORIZE,
} from "../tools/ErrorTypes";
import { getPages, PageInterface } from "./PageRepository";


export interface BookInterface {
  _id: ID;
  title: string;
  coverImage: string;
  mainAuthor: UserInterface;
  public: boolean;
  access?: boolean;
  favorite?: boolean;
  nbFavorite?: number;
  contributors?: Array<UserInterface>;
  pages?: Array<PageInterface>;
}

/**
 * Convert a *BookDocument* instance to a *BookInterface* one
 * @param {BookDocument} bookDocument BookDument instance to convert
 */
export function bookDocumentToBookInterface(
  bookDocument: BookDocument | string
): BookInterface {
  if (typeof bookDocument == 'string') return;
  const bookInterface: BookInterface = {
    _id: bookDocument._id,
    title: bookDocument.title,
    coverImage: bookDocument.coverImage,
    mainAuthor: userDocumentToUserInterface(bookDocument.mainAuthor),
    public: bookDocument.public,
  };
  return bookInterface;
}

/**
 * Create a book with the given informations
 * @param {string} title title of the book
 * @param {string} coverImage url of the image use as a cover for the book
 * @param {ID} mainAuthor main author id
 * @param {boolean} _public is the book accessible to the public or not ?
 */
export async function createBook(
  title: string,
  coverImage: string,
  mainAuthor: ID,
  _public: boolean
): Promise<BookInterface> {
  try {
    const book = await Book.create({
      title,
      mainAuthor,
      coverImage,
      contributors: [mainAuthor],
      public: _public,
      created: Date.now(),
      updated: Date.now(),
    });

    return bookDocumentToBookInterface(book);
  } catch {
    throw new Error(SERVER_ERROR);
  }
}

/**
 * Update a book with the given informations
 * @param _id id of the book to update
 * @param currentUser current user id (used to check the rights)
 * @param title new title of the book
 * @param coverImage new cover image
 * @param _public new publicity
 */
export async function updateBook(
  _id: ID,
  currentUser: ID,
  title: string,
  coverImage: string,
  _public: boolean
): Promise<BookInterface> {
  const bookToUpdate = await Book.findById(_id);

  if (!bookToUpdate) throw Error(RESOURCE_NOT_FOUND);
  if (!bookToUpdate.hasAccess(currentUser)) throw Error(UNAUTHORIZE);

  bookToUpdate.title = title;
  bookToUpdate.coverImage = coverImage;
  bookToUpdate.public = _public;
  bookToUpdate.updated = Date.now();

  // TODO : Add control for images

  try {
    return bookDocumentToBookInterface(await bookToUpdate.save());
  } catch (e) {
    console.log(e)
    throw new Error(SERVER_ERROR);
  }
}

/**
 * Get book informations by its Id
 * @param bookId id of the book to find
 * @param currentUser current user to check the rights
 * @param options what optional fields should be filled
 */
export async function getBookById(
  bookId: ID,
  currentUser: ID,
  options?: { pages?: boolean; contributors?: boolean }
) {
  const book = await Book.findById(bookId);

  if (!book) throw new Error(RESOURCE_NOT_FOUND);

  const userHasAccess = currentUser ? book.hasAccess(currentUser) : false;

  if (!book.public) {
    if (!currentUser) throw new Error(LOGIN_NEEDED);
    if (!userHasAccess) throw new Error(UNAUTHORIZE);
  }

  if (options.contributors) {
    book.populate("contributors");
  }


  const populatedBook = await book.execPopulate();

  const returnedBook: BookInterface = {
    _id: populatedBook._id,
    title: populatedBook.title,
    coverImage: populatedBook.coverImage,
    public: populatedBook.public,
    mainAuthor: userDocumentToUserInterface(populatedBook.mainAuthor),
    access: userHasAccess,
    favorite: currentUser ? await isUserFavorite(currentUser, populatedBook._id) : false,
    nbFavorite: await getFavoriteCount(populatedBook._id)
  };
  if (options.contributors) {
    returnedBook.contributors = populatedBook.contributors.map((u) =>
      userDocumentToUserInterface(u)
    );
  }
  if (options.pages) {
    returnedBook.pages = await getPages(bookId, currentUser);
  }

  return returnedBook;
}

/**
 * get book List
 * @param pageSize number of elements to get
 * @param pageNum starting page
 * @param uid current user id (to check the access and mark the book as favorite if needed)
 * @param options options to filter the results
 */
export async function getBooks(
  pageSize: number = 10,
  pageNum: number = 0,
  uid?: ID,
  options?: { userIsAContributor?: boolean; searchString?: string }
) {
  const filters: any = {};

  if (options.userIsAContributor) {
    filters.contributors = uid;
  } else {
    filters.public = true;
  }

  if (options.searchString) {
    filters.$text = { $search: options.searchString };
  }

  let books = await Book.find(filters)
    .sort({ updated: -1 })
    .skip(pageSize * pageNum)
    .limit(pageSize)
    .populate("mainAuthor");

  const booksToSend: BookInterface[] = await Promise.all(
    books.map(async (book) => ({
      _id: book._id,
      public: book.public,
      title: book.title,
      coverImage: book.coverImage,
      mainAuthor: userDocumentToUserInterface(book.mainAuthor),
      access: uid
        ? book.hasAccess(uid)
        : false,
      favorite: uid ? await isUserFavorite(uid, book._id) : false,
      nbFavorites: await getFavoriteCount(book._id),
    }))
  );

  return booksToSend;
}

/**
 * Delete a book
 * @param bookId id of the book to delete 
 * @param currentUserId current user id to check the permision
 */
export async function deleteBookById(bookId: ID, currentUserId: ID) {
  const book = await Book.findById(bookId);
  if (!book) throw new Error(RESOURCE_NOT_FOUND);

  if (!book.isMainAuthor(currentUserId)) throw new Error(UNAUTHORIZE);

  try {
    await Book.deleteOne({ _id: bookId });
    return bookDocumentToBookInterface(book);
  } catch {
    throw new Error(SERVER_ERROR);
  }
}

/**
 * Get the number of favorites on a book
 * @param bookId id of the book to check
 */
export async function getFavoriteCount(bookId: ID): Promise<number> {
  return await User.countDocuments({ favorites: bookId });
}

/**
 * get if the given user has marked the given book as favorite
 * @param userId 
 * @param bookId 
 */
export async function isUserFavorite(userId: ID, bookId: ID): Promise<boolean> {
  const user = await User.findById(userId);
  return user.favorites.indexOf(bookId) !== -1;
}
