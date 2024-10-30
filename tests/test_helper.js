const Note = require('../models/note')

const initialNotes = [
  {
    content: 'HTML is easy',
    important: false
  },
  {
    content: 'Browser can execute only JavaScript',
    important: true
  }
]

const nonExistingId = async () => {
  const note = new Note({ content: 'will delete this soon' })
  await note.save()
  await note.deleteOne()

  return note._id.toString()
}

const noteInDb = async () => {
  const notes = await Note.find({})
  console.log('notes in helper function',notes)
  return notes.map(note => note.toJSON())
}

module.exports = {
  initialNotes, nonExistingId, noteInDb
}