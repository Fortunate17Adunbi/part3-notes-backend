const { test, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')

const Note = require('../models/note')
mongoose.set('bufferTimeoutMS', 30000)

const api = supertest(app)

// const initialNotes = [
//   {
//     content: 'HTML is easy',
//     important: false,
//   },
//   {
//     content: 'Browser can execute only JavaScript',
//     important: true,
//   },
// ]

beforeEach(async () => {
  await Note.deleteMany({})
  console.log('cleared')

  const noteObjects = helper.initialNotes.map(note => new Note(note))
  const promiseArray = noteObjects.map(note => note.save())

  await Promise.all(promiseArray)
})

test('notes are returned as json', async () => {
  console.log('entered test')
  await api
    .get('/api/notes')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('there are two notes', async () => {
  const response = await api.get('/api/notes')
  // console.log('response', response)
  assert.strictEqual(response.body.length, helper.initialNotes.length)
})

test('the first note is about HTTP methods', async () => {
  const response = await api.get('/api/notes')

  const content = response.body.map(e => e.content)
  assert(content.includes('HTML is easy'))
})

test('a valid note can be added', async () => {
  const newNote = {
    content: 'async/await simplifies making async calls',
    important: true,
  }

  await api.post('/api/notes')
    .send(newNote)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  // const response = await api.get('/api/notes')
  const notesAtEnd = await helper.noteInDb()
  assert.strictEqual(notesAtEnd.length, helper.initialNotes.length + 1)

  const content = notesAtEnd.map(a => a.content)
  assert(content.includes('async/await simplifies making async calls'))
})

test('note without content is not added', async () => {
  const newNote = {
    important: true
  }

  await api.post('/api/notes')
    .send(newNote)
    .expect(400)

  const notesAtEnd = await helper.noteInDb()

  assert.strictEqual(notesAtEnd.length, helper.initialNotes.length)
})

test('a specific note can be viewed', async () => {
  const noteAtStart = await helper.noteInDb()
  const noteToView = noteAtStart[0]

  const result = await api.get(`/api/notes/${noteToView.id}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  assert.deepStrictEqual(result.body, noteToView)
})

test('a note can be deleted', async () => {
  const notesAtStart = await helper.noteInDb()
  const noteToDelete = notesAtStart[0]

  await api.delete(`/api/notes/${noteToDelete.id}`)
    .expect(204)

  const notesAtEnd = await helper.noteInDb()
  const contents = notesAtEnd.map(e => e.content)
  console.log('Content', contents)
  assert(!contents.includes(noteToDelete.content))

  assert.strictEqual(notesAtEnd.length, helper.initialNotes.length - 1)

})
after(async () => {
  await mongoose.connection.close()
})