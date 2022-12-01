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
import type {
  Oauth1AccessToken,
  Oauth1ClientConfig,
  ApiRequestContract,
  Oauth1RequestToken,
  RedirectRequestContract,
} from '../../types.js'

import debug from '../../debug.js'
import { Oauth1Signature } from './signature.js'
import { HttpClient } from '../../http_client.js'
import { UrlBuilder } from '../../url_builder.js'
import { MissingTokenException } from '../../exceptions/missing_token.js'
import { StateMisMatchException } from '../../exceptions/state_mismatch.js'

/**
 * A generic implementation of Oauth1. One can use it directly with any
 * Oauth1.0 or Oauth1.0a server
 */
export class Oauth1Client<Token extends Oauth1AccessToken> {
  constructor(public options: Oauth1ClientConfig) {}

  /**
   * Define the request token url. Can be overridden by config
   */
  protected requestTokenUrl: string = ''

  /**
   * Define the authorize url. Can be overridden by config
   */
  protected authorizeUrl: string = ''

  /**
   * Define the access token url. Can be overridden by config
   */
  protected accessTokenUrl: string = ''

  /**
   * Get the signature for the request
   */
  protected getSignature(
    baseUrl: string,
    method: 'get' | 'post',
    params: Record<string, any>,
    requestToken?: Oauth1RequestToken
  ) {
    return new Oauth1Signature({
      url: baseUrl,
      method: method.toUpperCase(),
      params: params,
      consumerKey: this.options.clientId,
      consumerSecret: this.options.clientSecret,
      nonce: string.random(32),
      unixTimestamp: Math.floor(new Date().getTime() / 1000),
      oauthToken: requestToken && requestToken.token,
      oauthTokenSecret: requestToken && requestToken.secret,
    }).generate()
  }

  /**
   * Make a signed request to the authorization server. The request follows
   * the Oauth1 spec and generates the Authorization header using the
   * [[Oauth1Signature]] class.
   */
  protected async makeSignedRequest(
    url: string,
    method: 'get' | 'post',
    requestToken?: Oauth1RequestToken,
    callback?: (request: ApiRequestContract) => void
  ) {
    const httpClient = this.httpClient(url)

    /**
     * Invoke callback to allow configuring request
     */
    if (typeof callback === 'function') {
      callback(httpClient)
    }

    /**
     * Generate oauth header
     */
    const { oauthHeader } = this.getSignature(
      url,
      method,
      {
        ...httpClient.getParams(),
        ...httpClient.getOauth1Params(),
        /**
         * Send request body when as urlencoded query string
         * https://oauth1.wp-api.org/docs/basics/Signing.html#json-data
         */
        ...(httpClient.getRequestType() === 'urlencoded' ? httpClient.getFields() : {}),
      },
      requestToken
    )

    /**
     * Set the oauth header
     */
    httpClient.header('Authorization', `OAuth ${oauthHeader}`)

    /**
     * Make HTTP request
     */
    const response = await httpClient[method]()
    return this.processClientResponse(url, httpClient, response)
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
   * Configure the request token request. Invoked before
   * the user callback.
   *
   * The client defaults can be removed using the `clearParam` or
   * `clearOauth1Param` methods
   */
  protected configureRequestTokenRequest(_: ApiRequestContract) {}

  /**
   * Processing the API client response. The child class can overwrite it
   * for more control
   */
  protected processClientResponse(_: string, client: HttpClient, response: any): any {
    /**
     * Return json as it is when parsed response as json
     */
    if (client.getResponseType() === 'json') {
      return response
    }

    return parse(client.getResponseType() === 'buffer' ? response.toString() : response)
  }

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
   * Verify state and the input value and raise exception if different or missing
   */
  verifyState(state: string, inputValue?: string) {
    if (!state || state !== inputValue) {
      throw new StateMisMatchException()
    }
  }

  /**
   * Returns the oauth token and secret for the upcoming requests
   */
  async getRequestToken(
    callback?: (request: ApiRequestContract) => void
  ): Promise<Oauth1RequestToken> {
    const requestTokenUrl = this.options.requestTokenUrl || this.requestTokenUrl

    if (!requestTokenUrl) {
      throw new RuntimeException(
        'Missing "config.requestTokenUrl". The property is required to get request token'
      )
    }

    const requestTokenResponse = await this.makeSignedRequest(
      requestTokenUrl,
      'post',
      undefined,
      (request) => {
        request.oauth1Param('oauth_callback', this.options.callbackUrl)
        this.configureRequestTokenRequest(request)

        if (typeof callback === 'function') {
          callback(request)
        }
      }
    )
    if (debug.enabled) {
      debug('oauth1 request token response %o', requestTokenResponse)
    }

    const {
      oauth_token: oauthToken,
      oauth_token_secret: oauthTokenSecret,
      ...parsed
    } = requestTokenResponse

    /**
     * We expect the response to have "oauth_token" and "oauth_token_secret"
     */
    if (!oauthToken || !oauthTokenSecret) {
      throw new MissingTokenException(MissingTokenException.oauth1Message, { cause: parsed })
    }

    return {
      token: oauthToken as string,
      secret: oauthTokenSecret as string,
      ...parsed,
    }
  }

  /**
   * Returns the redirect url for redirecting the user. We don't pre-define
   * any params here. However, one must define the "oauth_token" param
   * by passing a callback.
   *
   * ```ts
   * client.getRedirectUrl((request) => {
   *   request.param('oauth_token', value)
   * })
   * ```
   */
  getRedirectUrl(callback?: (request: RedirectRequestContract) => void): string | Promise<string> {
    const authorizeUrl = this.options.authorizeUrl || this.authorizeUrl
    if (!authorizeUrl) {
      throw new RuntimeException(
        'Missing "config.authorizeUrl". The property is required to make redirect url'
      )
    }

    const urlBuilder = this.urlBuilder(authorizeUrl)

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
      debug('oauth1 redirect url: "%s"', url)
    }

    return url
  }

  /**
   * Get the access token from the oauth_verifier code. One must define
   * the "oauth_verifier" code using the callback input.
   *
   * ```ts
   * client.getAccessToken({ token, secret }, (request) => {
   *   request.oauth1Param('oauth_verifier', verifierValue)
   * })
   * ```
   */
  async getAccessToken(
    requestToken: Oauth1RequestToken,
    callback?: (request: ApiRequestContract) => void
  ): Promise<Token> {
    const accessTokenUrl = this.options.accessTokenUrl || this.accessTokenUrl

    /**
     * Even though the spec allows to generate access token without the "oauthTokenSecret".
     * We enforce both the "oauthToken" and "oauthTokenSecret" to exist. This ensures
     * better security
     */
    if (!requestToken.token) {
      throw new RuntimeException(
        'Missing "requestToken.token". The property is required to generate access token'
      )
    }

    if (!requestToken.secret) {
      throw new RuntimeException(
        'Missing "requestToken.secret". The property is required to generate access token'
      )
    }

    if (!accessTokenUrl) {
      throw new RuntimeException(
        'Missing "config.accessTokenUrl". The property is required to generate access token'
      )
    }

    /**
     * Make signed request.
     */
    const accessTokenResponse = await this.makeSignedRequest(
      accessTokenUrl,
      'post',
      requestToken,
      (request) => {
        this.configureAccessTokenRequest(request)

        if (typeof callback === 'function') {
          callback(request)
        }
      }
    )
    if (debug.enabled) {
      debug('oauth1 access token response %o', accessTokenResponse)
    }

    const {
      oauth_token: accessOauthToken,
      oauth_token_secret: accessOauthTokenSecret,
      ...parsed
    } = accessTokenResponse

    /**
     * We expect the response to have "oauth_token" and "oauth_token_secret"
     */
    if (!accessOauthToken || !accessOauthTokenSecret) {
      throw new MissingTokenException(MissingTokenException.oauth1Message, { cause: parsed })
    }

    return {
      token: accessOauthToken as string,
      secret: accessOauthTokenSecret as string,
      ...parsed,
    }
  }
}
