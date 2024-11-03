const mongoose = require('mongoose')

const usernameReg = /^[a-zA-Z][a-zA-Z0-9]*/
const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // this ensures the uniqueness of username
    minLength: 4,
    validate: {
      validator: function(v) {
        return usernameReg.test(v)
      },
      message: 'username must start with alphabet and only contain alphanumeric values'
    }
  },
  name: String,
  passwordHash: String,
  notes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note'
    }
  ]

})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject.__v
    delete returnedObject._id
    delete returnedObject.passwordHash
  }
})

const User = mongoose.model('User', userSchema)

module.exports = User