const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')

const bcrypt = require('bcryptjs')
const Note = require('../models/note')
const User = require('../models/user')
mongoose.set('bufferTimeoutMS', 80000)

const api = supertest(app)

describe('when there is initially some notes saved', () => {
  beforeEach(async () => {
    await Note.deleteMany({})
    console.log('cleared')
    await Note.insertMany(helper.initialNotes)
  })

  test('notes are returned as json', async () => {
    console.log('entered test')
    await api
      .get('/api/notes')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all notes are returned', async () => {
    const response = await api.get('/api/notes')
    // console.log('response', response)
    assert.strictEqual(response.body.length, helper.initialNotes.length)
  })

  test('a specific note is within returned notes', async () => {
    const response = await api.get('/api/notes')
    const content = response.body.map(e => e.content)
    assert(content.includes('HTML is easy'))
  })

  test('a specific note can be viewed', async () => {
    const noteAtStart = await helper.noteInDb()
    const noteToView = noteAtStart[0]
    const result = await api.get(`/api/notes/${noteToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    assert.deepStrictEqual(result.body, noteToView)
  })

  describe('viewing a specific note', () => {
    test('succeeds with valid id', async () => {
      const noteAtStart = await helper.noteInDb()
      console.log('Note at start', noteAtStart)
      const noteToView = noteAtStart[0]
      console.log('note to view', noteToView)
      const resultNote = await api.get(`/api/notes/${noteToView.id}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      assert.deepStrictEqual(resultNote.body, noteToView)
    })

    test('fails with statuscode 404 if note does not exist', async () => {
      const validNonexistingId = await helper.nonExistingId()

      await api
        .get(`/api/notes/${validNonexistingId}`)
        .expect(404)
    })

    test('fails with statuscode 400 id is invalid', async () => {
      const invalidId = '5a3d5da59070081a82a3445'

      await api
        .get(`/api/notes/${invalidId}`)
        .expect(400)
    })
  })

  describe('addition of new note', () => {
    test('succeeds with valid data', async () => {
      const newNote = {
        content: 'async/await simplifies making async calls',
        important: true,
      }

      await api.post('/api/notes')
        .send(newNote)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const notesAtEnd = await helper.noteInDb()
      assert.strictEqual(notesAtEnd.length, helper.initialNotes.length + 1)

      const content = notesAtEnd.map(a => a.content)
      assert(content.includes('async/await simplifies making async calls'))
    })

    test('fails with status code 400 if data invalid', async () => {
      const newNote = {
        important: true
      }

      await api.post('/api/notes')
        .send(newNote)
        .expect(400)

      const notesAtEnd = await helper.noteInDb()
      console.log('notes at end', notesAtEnd)

      assert.strictEqual(notesAtEnd.length, helper.initialNotes.length)
    })

  })

  describe('deletion of a note', () => {
    test('succeeds with status code 204 if id is valid', async () => {
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
  })
})

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    console.log('cleared')
    // console.log('user', User.schema)

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })
    await user.save()
  })

  test('creation succeeds with fresh username', async () => {
    const usersAtStart = await helper.usersInDb()
    console.log('User at start', usersAtStart)
    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api.post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const username = usersAtEnd.map(user => user.username)
    assert(username.includes(newUser.username))
  })

  test('creation fails with proper status code and message if username is already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }
    console.log('new user', newUser)
    const result = await api.post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    // console.log('response', result.body)
    // console.log('users at end', usersAtEnd)
    assert(result.body.error.includes('expected `username` to be unique'))
    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })
})

after(async () => {
  await mongoose.connection.close()
})