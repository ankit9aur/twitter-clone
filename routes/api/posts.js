const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const User = require('../../schemas/UserSchema')
const Post = require('../../schemas/PostSchema')
const router = express.Router()

app.use(bodyParser.urlencoded({ extended: false }))
router.get('/', (req, res, next) => {
  Post.find()
    .populate('postedBy')
    .populate('retweetData')
    .sort({ createdAt: -1 })
    .then(async (results) => {
      results = await User.populate(results, { path: 'retweetData.postedBy' })
      res.status(200).send(results)
    })
    .catch((error) => {
      console.log(error)
      res.sendStatus(400)
    })
})
router.get('/:id', async (req, res, next) => {
  var postId = req.params.id
  var postData = await getPosts({ _id: postId })
  postData = postData[0]

  var results = {
    postData,
  }

  if (postData.replyTo !== undefined) {
    results.replyTo = postData.replyTo
  }

  results.replies = await getPosts({ replyTo: postId })

  return res.status(200).send(results)
})
router.post('/', async (req, res, next) => {
  if (!req.body.content) {
    return res.sendStatus(400)
  }
  var postData = {
    content: req.body.content,
    postedBy: req.session.user,
  }
  if (req.body.replyTo) {
    postData.replyTo = req.body.replyTo
  }
  Post.create(postData)
    .then(async (newPost) => {
      newPost = await User.populate(newPost, { path: 'postedBy' })
      res.status(201).send(newPost)
    })
    .catch((err) => {
      console.log(err)
      res.sendStatus(400)
    })
})
router.put('/:id/like', async (req, res, next) => {
  var postId = req.params.id
  var userId = req.session.user._id
  var isLiked =
    req.session.user.likes && req.session.user.likes.includes(postId)
  var option = isLiked ? '$pull' : '$addToSet'
  req.session.user = await User.findByIdAndUpdate(
    userId,
    { [option]: { likes: postId } },
    { new: true }
  ).catch((error) => {
    console.log(error)
    res.sendStatus(400)
  })
  var post = await Post.findByIdAndUpdate(
    postId,
    { [option]: { likes: userId } },
    { new: true }
  )
  res.status(200).send(post)
})
router.post('/:id/retweet', async (req, res, next) => {
  var postId = req.params.id
  var userId = req.session.user._id
  var deletePost = await Post.findOneAndDelete({
    postedBy: userId,
    retweetData: postId,
  }).catch((error) => {
    console.log(error)
    res.sendStatus(400)
  })

  var option = deletePost !== null ? '$pull' : '$addToSet'

  var repost = deletePost

  if (repost == null) {
    repost = await Post.create({ postedBy: userId, retweetData: postId }).catch(
      (error) => {
        res.sendStatus(400)
      }
    )
  }
  req.session.user = await User.findByIdAndUpdate(
    userId,
    { [option]: { retweets: repost._id } },
    { new: true }
  ).catch((error) => {
    res.sendStatus(400)
  })
  var post = await Post.findByIdAndUpdate(
    postId,
    { [option]: { retweetUsers: userId } },
    { new: true }
  ).catch((error) => {
    console.log(error)
    res.sendStatus(400)
  })
  res.status(200).send(post)
})
router.delete('/:id', (req, res, next) => {
  Post.findByIdAndDelete(req.params.id)
    .then(() => res.sendStatus(202))
    .catch(() => res.sendStatus(400))
})
async function getPosts(filter) {
  var results = await Post.find(filter)
    .populate('retweetData')
    .populate('postedBy')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .catch((error) => {
      console.log(error)
    })
  results = await User.populate(results, { path: 'replyTo.postedBy' })
  return User.populate(results, { path: 'retweetData.postedBy' })
}
module.exports = router
