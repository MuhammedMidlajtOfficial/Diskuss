const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const {app} = require('./src/index');

app.use(bodyParser.json());

let books = [
    { id: 1, title: "1984", author: "George Orwell" },
    { id: 2, title: "To Kill a Mockingbird", author: "Harper Lee" }
];


describe('APIHealthChecker',  () => {
    it('should return a successful response for base route', async () => {
        const rest = await request(app).get('/api/v1');
        // console.log("rest : ", rest.body.message);
        expect(rest.statusCode).toBe(200);
        expect(rest.body.message).toBe("Welcome to the Know Connections API v1");
        // expect(rest.body.success).toBe(true);
        // const response = {
        //     statusCode: 200,
        //     body: { success: true }
        // }
        // // console.log(response.body);
        // expect(response.statusCode).toBe(200);
        // expect(response.body.success).toBe(true);
    });

    /**
     * request : /api/v1/analytic
     * response:{
        "views": 0,
        "uniqueVisitors": 0,
        "shares": {
            "total": 0,
            "viewed": 0,
            "unviewed": 0
        },
        "clicks": 0,
        "clickThroughRate": "0.00"
        }
     */
    it('should return a successful analytic', async () => {
        const rest = await request(app).get('/api/v1/analytic');
        // console.log("rest : ", rest.body.message);
        expect(rest.statusCode).toBe(200);
        //views should be greater than or equla to 0
        expect(rest.body.views).toBeGreaterThanOrEqual(0);
        expect(rest.body.uniqueVisitors).toBeGreaterThanOrEqual(0);
        expect(rest.body.shares.total).toBeGreaterThanOrEqual(0);
        expect(rest.body.shares.viewed).toBeGreaterThanOrEqual(0);
        expect(rest.body.shares.unviewed).toBeGreaterThanOrEqual(0);
        expect(rest.body.clicks).toBeGreaterThanOrEqual(0);        
    });

});


// Define your routes here...

// describe('Books API', () => {
    
//     it('should retrieve all books', async () => {
//         const response = await request(app).get('/books');
//         expect(response.statusCode).toBe(200);
//         expect(response.body.length).toBe(2);
//     });

//     it('should add a new book', async () => {
//         const response = await request(app)
//             .post('/books')
//             .send({ title: 'Brave New World', author: 'Aldous Huxley' });
        
//         expect(response.statusCode).toBe(201);
//         expect(response.body.title).toBe('Brave New World');
//         expect(response.body.author).toBe('Aldous Huxley');
//     });

//     it('should retrieve a book by ID', async () => {
//         const response = await request(app).get('/books/1');
//         expect(response.statusCode).toBe(200);
//         expect(response.body.title).toBe("1984");
//     });

//     it('should update a book by ID', async () => {
//         const response = await request(app)
//             .put('/books/1')
//             .send({ title: 'Nineteen Eighty-Four', author: 'George Orwell' });
        
//         expect(response.statusCode).toBe(200);
//         expect(response.body.title).toBe('Nineteen Eighty-Four');
//     });

//     it('should delete a book by ID', async () => {
//         const response = await request(app).delete('/books/1');
//         expect(response.statusCode).toBe(204);
        
//         // Verify that the book has been deleted
//         const getResponse = await request(app).get('/books/1');
//         expect(getResponse.statusCode).toBe(404); // Book not found
//     });
// });

