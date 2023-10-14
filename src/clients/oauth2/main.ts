/*
 * @poppinss/oauth-client
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { parse } from 'node:querystring'
import string from '@poppinss/utils/string'
import { RuntimeException } from '@poppinss/utils'

import {
  Oauth2AccessToken,
  Oauth2ClientConfig,
  ApiRequestContract,
  RedirectRequestContract,
} from '../../types.js'

import debug from '../../debug.js'
import { HttpClient } from '../../http_client.js'
import { UrlBuilder } from '../../url_builder.js'
import { E_OAUTH_MISSING_TOKEN, E_OAUTH_STATE_MISMATCH } from '../../errors.js'

/**
 * Generic implementation of OAuth2.
 */
export class Oauth2Client<Token extends Oauth2AccessToken> {
  constructor(public options: Oauth2ClientConfig) {}

  /**
   * Define the authorize url. Can be overridden by config
   */
  protected authorizeUrl: string = ''

  /**
   * Define the access token url. Can be overridden by config
   */
  protected accessTokenUrl: string = ''

  /**
   * Processing the API client response. The child class can overwrite it
   * for more control
   */
  protected processClientResponse(client: HttpClient, response: any): any {
    /**
     * Return json as it is when parsed response as json
     */
    if (client.getResponseType() === 'json') {
      return response
    }

    return parse(client.getResponseType() === 'buffer' ? response.toString() : response)
  }

  /**
   * Configure the redirect request. Invoked before
   * the user callback.
   *
   * The client defaults can be removed using the `clearParam` method
   */
  protected configureRedirectRequest(_: RedirectRequestContract) {}

  /**
   * Configure the access token request. Invoked before
   * the user callback.
   *
   * The client defaults can be removed using the `clearParam` or
   * `clearOauth1Param` methods
   */
  protected configureAccessTokenRequest(_: ApiRequestContract) {}

  /**
   * Returns the instance of the HTTP client for internal use
   */
  protected httpClient(url: string) {
    return new HttpClient(url)
  }

  /**
   * Returns the instance of the URL builder
   */
  protected urlBuilder(url: string) {
    return new UrlBuilder(url)
  }

  /**
   * Returns the redirect url for redirecting the user. Pre-defines
   * the following params
   *
   * - redirect_uri
   * - client_id
   */
  getRedirectUrl(callback?: (request: RedirectRequestContract) => void): string | Promise<string> {
    const authorizeUrl = this.options.authorizeUrl || this.authorizeUrl
    if (!authorizeUrl) {
      throw new RuntimeException(
        'Missing "config.authorizeUrl". The property is required to make redirect url'
      )
    }

    const urlBuilder = this.urlBuilder(authorizeUrl)

    /**
     * Default params. One can call `clearParam` to remove them
     */
    urlBuilder.param('redirect_uri', this.options.callbackUrl)
    urlBuilder.param('client_id', this.options.clientId)

    this.configureRedirectRequest(urlBuilder)

    /**
     * Invoke callback when defined. This is the place where one can configure
     * the request query params
     */
    if (typeof callback === 'function') {
      callback(urlBuilder)
    }

    const url = urlBuilder.makeUrl()
    if (debug.enabled) {
      debug('oauth2 redirect url: "%s"', url)
    }

    return url
  }

  /**
   * Generates a random token to be stored as a state and to be sent along
   * for later verification
   */
  getState() {
    return string.random(32)
  }

  /**
   * Verifies the redirect input with the state input
   */
  verifyState(state: string, inputValue?: string) {
    if (!state || state !== inputValue) {
      throw new E_OAUTH_STATE_MISMATCH()
    }
  }

  /**
   * Get the access token from the authorization code. One must define
   * the authorization code using the callback input.
   *
   * ```ts
   * client.getAccessToken((request) => {
   *   request.field('code', authorizationCode)
   * })
   * ```
   *
   * Pre-defines the following form fields
   *
   * - grant_type = 'authorization_code'
   * - redirect_uri
   * - client_id
   * - client_secret
   */
  async getAccessToken(callback?: (request: ApiRequestContract) => void): Promise<Token> {
    const accessTokenUrl = this.options.accessTokenUrl || this.accessTokenUrl
    if (!accessTokenUrl) {
      throw new RuntimeException(
        'Missing "config.accessTokenUrl". The property is required to get access token'
      )
    }

    const httpClient = this.httpClient(accessTokenUrl)

    /**
     * Default field. One can call `clearField` to remove them
     */
    httpClient.field('grant_type', 'authorization_code')
    httpClient.field('redirect_uri', this.options.callbackUrl)
    httpClient.field('client_id', this.options.clientId)
    httpClient.field('client_secret', this.options.clientSecret)

    /**
     * Expecting JSON response. One can call `parseAs('text')` for urlencoded
     * response
     */
    httpClient.parseAs('json')

    this.configureAccessTokenRequest(httpClient)

    /**
     * Invoke the user callback after setting defaults. This allows the callback
     * to clear/overwrite them
     */
    if (typeof callback === 'function') {
      callback(httpClient)
    }

    /**
     * Make request and parse response
     */
    const response = await httpClient.post()
    const accessTokenResponse = this.processClientResponse(httpClient, response)
    if (debug.enabled) {
      debug('oauth2 access token response %o', accessTokenResponse)
    }

    const {
      access_token: accessToken,
      token_type: tokenType,
      expires_in: expiresIn,
      refresh_token: refreshToken,
      ...parsed
    } = accessTokenResponse

    /**
     * We expect the response to have "access_token"
     */
    if (!accessToken) {
      throw new E_OAUTH_MISSING_TOKEN(E_OAUTH_MISSING_TOKEN.oauth2Message, { cause: parsed })
    }

    return {
      token: accessToken,
      type: tokenType,
      expiresIn,
      ...(expiresIn ? { expiresAt: new Date(new Date().getTime() + 1000 * expiresIn) } : {}),
      refreshToken,
      ...parsed,
    }
  }
}
