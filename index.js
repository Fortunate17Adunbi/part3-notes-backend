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

let notes = [
    {
        id: "1",
        content: "HTML is easy",
        important: true
    },
    {
        id: "2",
        content: "Browser can execute only JavaScript",
        important: false
    },
    {
        id: "3",
        content: "GET and POST are the most important methods of the HTTP protocol",
        important: false
    },
    {
        id: "4",
        content: "Post is used to create new resources",
        important: false
    }
]


const generateId = () => {
    const maxId = notes.length > 0
    ? Math.max(...notes.map(n => Number(n.id))) 
    : 0

    return String(maxId + 1)
}
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.post('/api/notes', (request, response) => {
    const body = request.body
    if (!body.content) {
        return response.status(400).json({
            error: "content missing"
        })
    }
    // console.log("body important",body.important)
    const note = new Note ({
        content: body.content,
        important: body.important || false,
    })

    note.save().then(savedNote => {
        console.log(savedNote)
        response.json(savedNote)
    }).catch(error => {
        console.log(`Could not save note try again: ${error.message}`)
    })
    
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
app.get('/api/notes/:id', (request, response) => {
    const id = request.params.id
    Note.findById(id).then(note => {
        response.json(note)
    }).catch(error => {
        console.log(`Could not get note try again: ${error.message}`)
    })
})

app.delete('/api/notes/:id', (request, response) => {
    const id = Number(request.params.id)
    notes = notes.filter(note => note.id !== id)
    response.status(204).end()
})

app.put('/api/notes/:id', (request, response) => {
    const id = request.params.id
    const body = request.body
    const nameExists = notes.filter(note => note.id == id)
   if (nameExists.length > 0 ) {
    notes = notes.map(note => note.id !== id ? note : body) 
    response.json(body)
   }
    else{
        response.status(404).end()
    }
})

app.use(unknownEndpoint)
const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`server runningon port ${PORT}`)
})
