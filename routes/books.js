const express = require("express");
const Book = require("../models/book");

const router = new express.Router();
const ExpressError = require("../expressError");

const jsonschema = require("jsonschema");
const bookSchemaCreate = require("../schemas/bookSchemaCreate.json")
const bookSchemaUpdate = require("../schemas/bookSchemaUpdate.json")

/** GET / => {books: [book, ...]}  */

router.get("/", async function (req, res, next) {
  try {
    const books = await Book.findAll(req.query);
    return res.json({ books });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  => {book: book} */

router.get("/:id", async function (req, res, next) {
  try {
    const book = await Book.findOne(req.params.id);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
});

/** POST /   bookData => {book: newBook}  */

router.post("/", async function (req, res, next) {
  try {

    //Validate req.body against the book schema:
    const result = jsonschema.validate(req.body, bookSchemaCreate);

    //if it's not valid, collect all errors in an array
    if (!result.valid) {
      const listOfErrors = result.errors.map(e => e.stack);
      const err = new ExpressError(listOfErrors, 400);
      console.log('It is invalid!');
      return next(err);
    }
    //if it's valid, create new book data.
    const book = await Book.create(req.body);
    return res.status(201).json({ book });
  } catch (err) {
    return next(err);
  }
});

/** PUT /[isbn]   bookData => {book: updatedBook}  */

router.put("/:isbn", async function (req, res, next) {
  try {
    if ('isbn' in req.body) {
      return next({ status: 400, message: "Not allowed"})
    }
    const result = jsonschema.validate(req.body, bookSchemaUpdate);

    if (!result.valid) {
      const listOfErrors = result.errors.map(e => e.stack);
      const err = new ExpressError(listOfErrors, 400);

      return next(err);
    }
    const book = await Book.update(req.params.isbn, req.body);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[isbn]   => {message: "Book deleted"} */

router.delete("/:isbn", async function (req, res, next) {
  try {
    await Book.remove(req.params.isbn);
    return res.json({ message: "Book deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
