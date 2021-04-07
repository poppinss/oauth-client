import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
dotenv.config()

const app = express()
app.use(cookieParser('averylongrandom32charactersecret'))

app.get('/github', require('./github').renderRedirect)
app.get('/github/callback', require('./github').handleCallback)

app.get('/twitter', require('./twitter').renderRedirect)
app.get('/twitter/callback', require('./twitter').handleCallback)

app.get('/google', require('./google').renderRedirect)
app.get('/google/callback', require('./google').handleCallback)

app.get('/gitlab', require('./gitlab').renderRedirect)
app.get('/gitlab/callback', require('./gitlab').handleCallback)

app.listen(3000, () => console.log('Listening on http://localhost:3000'))
