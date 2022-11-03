/*
 * @poppinss/oauth-client
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Request, Response } from 'express'

import { twitterConfig } from './config.js'
import { Oauth1Client } from '../src/clients/oauth1/main.js'

export async function renderRedirect(_: Request, res: Response) {
  /**
   * Instantiate the driver
   */
  const driver = new Oauth1Client(twitterConfig)

  const { token, secret } = await driver.getRequestToken()

  /**
   * Make the redirect URL. We also send the state in the URL query string,
   * along with a github specific "allow_signup" option.
   */
  const redirectUrl = driver.getRedirectUrl((request) => {
    request.param('oauth_token', token)
  })

  /**
   * Store state inside cookie for later verification
   */
  res.cookie('twitter_oauth_token', token, { sameSite: false })
  res.cookie('twitter_oauth_token_secret', secret, { sameSite: false })
  res.type('html').send(`<a href="${redirectUrl}">Login with Twitter</a>`)
}

export async function handleCallback(req: Request, res: Response) {
  const oauthToken = req.query.oauth_token as string
  const oldOauthToken = req.cookies.twitter_oauth_token
  const oauthVerifier = req.query.oauth_verifier as string
  const oauthSecret = req.cookies.twitter_oauth_token_secret

  if (!oauthToken) {
    res.status(400).send('Missing "oauth_token"')
    return
  }

  if (!oauthVerifier) {
    res.status(400).send('Missing "oauth_verifier"')
    return
  }

  /**
   * Instantiate the driver
   */
  const driver = new Oauth1Client(twitterConfig)

  try {
    driver.verifyState(oldOauthToken, oauthToken)
    const accessToken = await driver.getAccessToken(
      {
        token: oauthToken,
        secret: oauthSecret,
      },
      (request) => {
        request.oauth1Param('oauth_verifier', oauthVerifier)
      }
    )
    res.type('json').send(accessToken)
  } catch (error) {
    res.send(error.response && error.response.body ? error.response.body : error.response || error)
  }
}
