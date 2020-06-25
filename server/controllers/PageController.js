const Book = require("../models/Book");
const Page = require("../models/Page");
const authenticationController = require("./AuthenticationController");

class PageController {
  /**
   * Create a new page
   * @param req
   * @param res
   * @bodyParam title string
   * @bodyParam content string
   * @bodyParam images string[]
   * @bodyParam location {lat, lng, label}
   */
  async addPage(req, res) {
    const body = req.body;
    const currentUser = authenticationController.currentUser;

    // Get the book
    const book = await Book.findOne({_id: req.params.book});

    // Check if the book exists
    if (!book) return res.status(404).json({error: "Le livre n'existe pas."});

    // Check if the user has access to the book
    if (!book.hasAccess(currentUser))
      return res.status(401).json({error: "Vous n'êtes pas autorisé à modifier ce livre."});

    // Create the page
    const newPage = new Page({
      mainAuthor: currentUser,
      lastAuthor: currentUser,
      title: body.title,
      content: body.content,
      location: body.location,
      images: body.images,
      book: book,
      created: Date.now(),
      updated: Date.now()
    });

    newPage.save((err, page) => {
      if (err) return res.status(500).json({error: "Une erreur est survenue pendant l'ajout de la page."});
      return res.json({success: "La page " + page.title + " a bien été créée."});
    });
  }

  /**
   * Update a page
   * @param req
   * @param res
   * @requestParam book string
   * @requestParam page string
   * @bodyParam title string
   * @bodyParam content string
   * @bodyParam images string[]
   * @bodyParam location {lat, lng, label}
   */
  async updatePage(req, res) {
    const body = req.body;
    const currentUser = authenticationController.currentUser;

    // the page exists and current user has access to it.
    const page = await Page.findOne({book: req.params.book, _id: req.params.page}).populate('book');

    if (!page)
      return res.status(404).json({error: "La page demandée n'existe pas"});

    if (!page.book.hasAccess(currentUser))
      return res.status(401).json("Vous n'avez pas l'autorisation d'accéder à ce livre.");

    // Update infos and save the page
    page.title = body.title;
    page.content = body.content;
    page.images = body.images;
    page.location = body.location;
    page.updated = Date.now();
    page.lastAuthor = currentUser;

    page.save((err, page) => {
      if (err) return res.status(500).json({error: "Une erreur est survenue pendant la modification de la page."});
      return res.json({success: "La page " + page.title + " a bien été modifiée."});
    });
  }

  /**
   * Delete a page
   * @param req
   * @param res
   * @requestParam book string
   * @requestParam page string
   */
  async deletePage(req, res) {
    const currentUser = authenticationController.currentUser;

    // Get page
    const page = await Page.findOne({book: req.params.book, _id: req.params.page}).populate('book');
    if (!page) return res.status(404).json({error: "La page n'existe pas."});

    // Check authorisation
    if ((!page.isMainAuthor(currentUser)) && (!page.book.isMainAuthor(currentUser)))
      return res.status(401).json({error: "Vous n'êtes pas autorisé à supprimer cette page"});

    // delete the page
    await Page.deleteOne({_id: req.params.page}, err => {
      if (err) return res.status(500).json({
        error: "Une erreur est intervenue pendant la suppression de la page",
        message: err.error
      });
      return res.json({success: "La page a bien été supprimée"});
    });
  }

  /**
   * get pages
   * @param req
   * @param res
   * @requestParam book
   */
  async getPages(req, res) {
    const currentUser = authenticationController.currentUser;
    // Check authorisation on the book
    const book = await Book.findOne({_id: req.params.book});
    if (!book) return res.status(404).json({error: "Le livre n'existe pas."});
    if (!book.hasAccess(currentUser)) return req.status(401).json({error: "Vous n'avez pas la permission d'accéder au livre"});

    const pages = await Page.find({book: book});

    return res.json(pages);
  }

  /**
   * get a page by its id
   * @param req
   * @param res
   * @requestParam page string
   * @requestParam book string
   */
  async getPageById(req, res) {
    const currentUser = authenticationController.currentUser;
    // Check authorisation on the book
    const page = await Page.findOne({_id: req.params.page, book: req.params.book}).populate('book');
    if (!page) return res.status(404).json({error: "La page n'existe pas."});
    if (!page.book.hasAccess(currentUser)) return req.status(401).json({error: "Vous n'avez pas la permission d'accéder au livre"});

    return res.json(page);
  }

  async getCountriesWithLocations(req, res) {
    const currentUser = authenticationController.currentUser;
    // Check authorisation on the book
    const book = await Book.findOne({_id: req.params.book});
    if (!book) return res.status(404).json({error: "Le livre n'existe pas."});
    if (!book.hasAccess(currentUser)) return req.status(401).json({error: "Vous n'avez pas la permission d'accéder au livre"});

    const countries = await Page.find({book: book}).distinct("location.country");

    return res.json(countries);
  }

  async getPagesFromCountry(req, res) {
    const currentUser = authenticationController.currentUser;
    // Check authorisation on the book
    const book = await Book.findOne({_id: req.params.book});
    if (!book) return res.status(404).json({error: "Le livre n'existe pas."});
    if (!book.hasAccess(currentUser)) return req.status(401).json({error: "Vous n'avez pas la permission d'accéder au livre"});

    const pages = await Page.find({book: req.params.book, 'location.country': req.params.country});

    return res.json(pages);
  }
}

const pageController = new PageController();

module.exports = pageController;
