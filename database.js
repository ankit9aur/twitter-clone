const mongoose = require('mongoose')

class Database {
  constructor() {
    this.connect()
  }
  connect() {
    mongoose
      .connect(
        'mongodb+srv://ankit9aur:12345@cluster0.vnjzcpf.mongodb.net/?retryWrites=true&w=majority'
      )
      .then(() => {
        console.log('MongoDB Connected')
      })
      .catch((err) => {
        console.log('error' + err)
      })
  }
}
module.exports = new Database()
