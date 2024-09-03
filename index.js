const express = require('express')
const app = express()
const cors = require('cors')

app.use(express.json())
app.use(cors())
app.use(express.static('dist'))

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

app.post('/api/notes', (request, response) => {
    const body = request.body
    if (!body.content) {
        return response.status(400).json({
            error: "content missing"
        })
    }

    const note = {
        content: body.content,
        important: Boolean(body.important) || false,
        id: generateId()
    }

    notes = notes.concat(note)
    response.json(note)
})
app.get('/', (request, response) => {
    response.send('<h1>Hello world!</h1>')
})

app.get('/api/notes', (request, response) => {
    console.log(notes)
    response.json(notes)
})

app.get('/api/notes/:id', (request, response) => {
    const id = request.params.id
    const note = notes.find(note => note.id === id)

    note ? response.json(note) : response.status(404).end()
})
app.delete('/api/notes/:id', (request, response) => {
    const id = request.params.id
    notes = notes.filter(note => note.id !== id)
    // note ? response.json(note) : response.status(404).end()
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

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`server runningon port ${PORT}`)
})
