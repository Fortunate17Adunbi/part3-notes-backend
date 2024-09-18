require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const Note = require('./models/note')
const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:', request.path)
  console.log('Body:', request.body)
  console.log('---')
  next()
}

app.use(express.json())
app.use(cors())
app.use(express.static('dist'))
app.use(requestLogger)

// let notes = [
// ]


// const generateId = () => {
//   const maxId = notes.length > 0
//     ? Math.max(...notes.map(n => Number(n.id)))
//     : 0

//   return String(maxId + 1)
// }

app.post('/api/notes', (request, response, next) => {
  const body = request.body
  if (!body.content) {
    return response.status(400).json({
      error: 'content missing'
    })
  }
  const note = new Note ({
    content: body.content,
    important: body.important || false,
  })

  note.save().then(savedNote => {
    console.log(savedNote)
    response.json(savedNote)
  }).catch(error => next(error))

})

app.get('/', (request, response) => {
  response.send('<h1>Hello world!</h1>')
})
app.get('/api/notes', (request, response) => {
  Note.find({}).then(notes => {
    response.json(notes)
  }).catch(error => {
    console.log(`Could not get notes try again: ${error.message}`)
  })
})
app.get('/api/notes/:id', (request, response, next) => {
  Note.findById(request.params.id).then(note => {
    if (note) {
      response.json(note)
    }
    else {
      response.status(404).end()
    }
  }).catch(error => next(error))
})

app.delete('/api/notes/:id', (request, response, next) => {
  // const id = Number(request.params.id)
  Note.findByIdAndDelete(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.put('/api/notes/:id', (request, response, next) => {
  const { content, important } = request.body

  Note.findByIdAndUpdate(request.params.id, { content, important }, { new: true, runValidators: true, context: 'query' })
    .then(updatedNote => {
      response.json(updatedNote)
    })
    .catch(error => next(error))
})
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }
  next(error)
}
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
})
