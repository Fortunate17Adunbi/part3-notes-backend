const mongoose = require('mongoose')
mongoose.set('bufferTimeoutMS', 30000)

if (process.argv.length < 3) {
  console.log('give password as argument')
  process.exit(1)
}

const password = process.argv[2]

const url =
  `mongodb+srv://noteUser:${password}@cluster1.hywww.mongodb.net/testNoteApp?retryWrites=true&w=majority`
// const url =
//   `mongodb+srv://noteUser:${password}@cluster1.hywww.mongodb.net/noteApp?retryWrites=true&w=majority`

mongoose.set('strictQuery',false)

mongoose.connect(url)

const noteSchema = new mongoose.Schema({
  content: String,
  important: Boolean,
})

const Note = mongoose.model('Note', noteSchema)

const note = new Note({
  content: 'this is testing mode',
  important: true,
})


note.save().then(() => {
  console.log('note saved!')
  mongoose.connection.close()
})
// Note.find({ important: true }).then(result => {
//   // console.log("result", result)
//   result.forEach(note => {
//     // console.log("note", note)
//     console.log(note)
//   })
//   mongoose.connection.close()
// })