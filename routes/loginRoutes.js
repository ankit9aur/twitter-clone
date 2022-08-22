const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const User = require('../schemas/UserSchema')
const router = express.Router()
const bcrypt = require('bcrypt')

app.set('view engine', 'pug')
app.set('views', 'views')
app.use(bodyParser.urlencoded({ extended: false }))
router.get('/', (req, res, next) => {
  res.status(200).render('login')
})
router.post('/', async (req, res, next) => {
  var payload = req.body
  if (req.body.logUsername && req.body.logPassword) {
    var user = await User.findOne({
      $or: [
        { username: req.body.logUsername },
        { email: req.body.logUsername },
      ],
    }).catch((err) => {
      console.log(err)
      payload.errorMessage = 'Something Went Wrong!'
      return res.status(200).render('login', payload)
    })
    if (user != null) {
      var result = await bcrypt.compare(req.body.logPassword, user.password)
      if (result == true) {
        req.session.user = user
        return res.redirect('/')
      }
    }
    payload.errorMessage = 'Username/password combination does not match'
    return res.status(200).render('login', payload)
  }
  payload.errorMessage = 'Make sure each field has valid input'
  res.status(200).render('login')
})
module.exports = router
