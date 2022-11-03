/*
 * @poppinss/oauth-client
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import express from 'express'
import dotenv from 'dotenv'
// @ts-expect-error
import cookieParser from 'cookie-parser'
dotenv.config()

const app = express()
app.use(cookieParser('averylongrandom32charactersecret'))

const githubController = await import('./github.js')
const twitterController = await import('./twitter.js')
const googleController = await import('./google.js')
const gitlabController = await import('./gitlab.js')

app.get('/github', githubController.renderRedirect)
app.get('/github/callback', githubController.handleCallback)

app.get('/twitter', twitterController.renderRedirect)
app.get('/twitter/callback', twitterController.handleCallback)

app.get('/google', googleController.renderRedirect)
app.get('/google/callback', googleController.handleCallback)

app.get('/gitlab', gitlabController.renderRedirect)
app.get('/gitlab/callback', gitlabController.handleCallback)

app.listen(3000, () => console.log('Listening on http://localhost:3000'))
