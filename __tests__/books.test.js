//Test for books routes.

process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let book_isbn;

beforeEach(async () => {
    //clean up db
    await db.query("DELETE FROM books");
    //create a new book for test
    const result = await db.query(`
    INSERT INTO
    books (isbn, amazon_url, author, language, pages, publisher, title, year)
    VALUES(
        '0691161518',
        'http://a.co/eobPtX2',
        'Matthew Lane',
        'English',
        264,
        'Princeton University Press',
        'Power-Up: Unlocking the Hidden Mathematics in Video Games',
        2017) 
        RETURNING isbn`);
    console.log('isbn',result.rows[0]);
    book_isbn = result.rows[0].isbn;
});

describe("GET /books", () => {
    test("Gets a list of books", async () => {
        const res = await request(app).get(`/books`);
        const books = res.body.books;

        expect(books).toHaveLength(1);
        expect(books[0]).toHaveProperty("isbn");
        expect(books[0]).toHaveProperty("amazon_url");
        });
})

describe("GET /books/:isbn", () => {
    test("Gets a book", async () => {
        const res = await request(app)
        .get(`/books/${book_isbn}`);
        expect(res.body.book).toHaveProperty("isbn");
        expect(res.body.book.isbn).toBe(book_isbn);
    });

    test("Responds with 404 if can't find book in question", async () => {
        const res = await request(app)
        .get(`/books/999`);
        expect(res.statusCode).toBe(404);
    })
})

describe("POST /books", () => {
    test("Creates a new book", async () => {
        const response = await request(app)
        .post('/books')
        .send({
            isbn: '0316535621',
            amazon_url: 'http://amazon.com',
            author: 'Malcolm Gladwell',
            language: 'English',
            pages: 123,
            publisher: 'Penguin',
            title: 'Talking to Strangers',
            year: 2019
        })
        expect(response.statusCode).toBe(201);
        expect(response.body.book).toHaveProperty("isbn");
    });
    
    test("Prevents creating book without required title", async () => {
        const res = await request(app)
        .post('/books')
        .send({year: 2000});
        expect(res.statusCode).toBe(400);
    })
})

describe("PUT /books/:id", () => {
    test("Updates a single book", async () => {
        const res = await request(app)
        .put(`/books/${book_isbn}`)
        .send({
            amazon_url: "http://amazon.co.jp",
            author: "M. G.",
            language: 'Japanese',
            pages: 1234,
            publisher:'Cat',
            title: 'Updated',
            year: 2000
        });
        expect(res.body.book).toHaveProperty("isbn");
        expect(res.body.book.title).toBe("Updated");
    });

    test("Prevents a bad book update", async () => {
        const res = await request(app)
        .put(`/books/${book_isbn}`)
        .send({
            isbn: "123"
        });
        expect(res.statusCode).toBe(400);
    })

    test("Reponds 404 if can't find book in question", async () => {
        //delete book first
        await request(app)
        .delete(`/books/${book_isbn}`);
        const res = await request(app).put(`/books/${book_isbn}`);
        
        expect(res.statusCode).toBe(400);
    })
})

describe("DELETE /books/:id", () => {
    test("Deletes a single book", async () => {
        const res = await request(app)
        .delete(`/books/${book_isbn}`)
        expect(res.body).toEqual({message: "Book deleted"});
    })
})

