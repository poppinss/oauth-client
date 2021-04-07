/*
 * @poppinss/oauth-client
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { parse } from 'querystring'
import { DateTime } from 'luxon'

import {
  Oauth2AccessToken,
  Oauth2ClientConfig,
  ApiRequestContract,
  RedirectRequestContract,
} from '../../Contracts'

import { HttpClient } from '../../HttpClient'
import { UrlBuilder } from '../../UrlBuilder'
import { OauthException } from '../../Exceptions'
import { generateRandom, Exception } from '../../utils'

/**
 * A generic implementation of OAuth2. One can use it directly with any auth2.0 server
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
    if (client.responseType === 'json') {
      return response
    }

    return parse(client.responseType === 'buffer' ? response.toString() : response)
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
   * Returns the redirect url for redirecting the user. Pre-defines
   * the following params
   *
   * - redirect_uri
   * - client_id
   */
  public getRedirectUrl(
    callback?: (request: RedirectRequestContract) => void
  ): string | Promise<string> {
    const authorizeUrl = this.options.authorizeUrl || this.authorizeUrl
    if (!authorizeUrl) {
      throw new Exception('Cannot make redirect url without "authorizeUrl"')
    }

    const urlBuilder = new UrlBuilder(authorizeUrl)

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

    return urlBuilder.makeUrl()
  }

  /**
   * Generates a random token to be stored as a state and to be sent along
   * for later verification
   */
  public getState() {
    return generateRandom(32)
  }

  /**
   * Verifies the redirect input with the state input
   */
  public verifyState(state: string, inputValue?: string) {
    if (!state || state !== inputValue) {
      throw OauthException.stateMisMatch()
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
  public async getAccessToken(callback?: (request: ApiRequestContract) => void): Promise<Token> {
    const accessTokenUrl = this.options.accessTokenUrl || this.accessTokenUrl
    if (!accessTokenUrl) {
      throw new Exception('Cannot get access token without "accessTokenUrl"')
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
     * Expecting JSON response. One call call `parseAs('text')` for urlencoded
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
    const {
      access_token: accessToken,
      token_type: tokenType,
      expires_in: expiresIn,
      refresh_token: refreshToken,
      ...parsed
    } = this.processClientResponse(httpClient, response)

    /**
     * We expect the response to have "access_token"
     */
    if (!accessToken) {
      throw OauthException.missingAccessToken(parsed)
    }

    return {
      token: accessToken,
      type: tokenType,
      expiresIn,
      ...(expiresIn ? { expiresAt: DateTime.local().plus({ seconds: expiresIn }) } : {}),
      refreshToken,
      ...parsed,
    }
  }

  /**
   * Create a new instance of the "Oauth2Client"
   */
  public child(options: Oauth2ClientConfig) {
    return new Oauth2Client(options)
  }
}
