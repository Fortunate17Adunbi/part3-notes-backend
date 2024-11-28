const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const helpers = require('./test_helper')
const app = require('../app')

const bcrypt = require('bcryptjs')
const Note = require('../models/note')
const User = require('../models/user')
mongoose.set('bufferTimeoutMS', 80000)

const api = supertest(app)

describe('user authentication', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    console.log('cleared')

    const passwordHash = await bcrypt.hash('password', 10)
    const user =  new User({ username: 'root', name: 'kodn', passwordHash })
    await user.save()
  })

  test('new user can be created', async () => {
    const usersAtStart =  await helpers.usersInDb()

    await api.post('/api/users')
      .send(helpers.newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helpers.usersInDb()

    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)
  })

  test('user can login', async () => {
    const usersAtStart = await helpers.usersInDb()
    console.log('user at start', usersAtStart[0].username)

    const response = await api.post('/api/login')
      .send({ username: usersAtStart[0].username, password: 'password' })
      .expect(200)

    console.log('response', response.body)

    assert.strictEqual(response.body.username, usersAtStart[0].username)
  })

  test('return error if login info is wrong', async () => {
    await api.post('/api/login')
      .send({ username: 'root', password: 'wrong' })
      .expect(401)
  })
})

describe('adding notes', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    console.log('cleared')
    await Note.deleteMany({})
    console.log('cleared')

    const passwordHash = await bcrypt.hash('password', 10)
    const user =  new User({ username: 'root', name: 'kodn', passwordHash })
    await user.save()

  })

  test('note is added for users with token', async () => {
    // login
    const response = await api.post('/api/login')
      .send({ username: 'root', password: 'password' })
      .expect(200)

    // Create note using token
    await api.post('/api/notes')
      .set('Authorization', `Bearer ${response.body.token}`)
      .send(helpers.newNote)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const user = await User.find({ username: response.body.username })
    console.log('user', user)
    const notesAtEnd = await helpers.noteInDb()
    console.log('notes at end', notesAtEnd)
    const content = notesAtEnd.map(note => note.content)
    const userId = notesAtEnd.map(note => note.user.toString())
    const noteId = notesAtEnd.map(note => note.id)
    const noteIdInUser = user.map(user => user.notes.toString())
    assert.strictEqual(notesAtEnd.length, 1)
    assert(content.includes(helpers.newNote.content))
    assert(userId.includes(user[0]._id.toString()))
    assert(noteIdInUser.includes(noteId[0]))
  })

  test('error is returned for users without token', async () => {
    // login
    const response = await api.post('/api/login')
      .send({ username: 'root', password: 'password' })
      .expect(200)

    console.log('response token', response.body.token)
    await api.post('/api/notes')
      .send(helpers.newNote)
      .expect(401)

  })
})


after(async () => {
  await mongoose.connection.close()
})