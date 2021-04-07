/*
 * @poppinss/oauth-client
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { parse } from 'querystring'
import {
  Oauth1AccessToken,
  Oauth1ClientConfig,
  ApiRequestContract,
  Oauth1RequestToken,
  RedirectRequestContract,
} from '../../Contracts'

import { generateRandom } from '../../utils'
import { UrlBuilder } from '../../UrlBuilder'
import { HttpClient } from '../../HttpClient'
import { OauthException } from '../../Exceptions'
import { Oauth1Signature } from './Oauth1Signature'

/**
 * A generic implementation of Oauth1. One can use it directly with any
 * Oauth1.0 or Oauth1.0a server
 */
export class Oauth1Client<Token extends Oauth1AccessToken> {
  constructor(public options: Oauth1ClientConfig) {}

  /**
   * Get the signature for the request
   */
  private getSignature(baseUrl: string, params: Record<string, any>) {
    return new Oauth1Signature({
      url: baseUrl,
      method: 'POST',
      params: params,
      consumerKey: this.options.clientId,
      consumerSecret: this.options.clientSecret,
      nonce: generateRandom(32),
      unixTimestamp: Math.floor(new Date().getTime() / 1000),
      oauthToken: this.options.oauthToken,
      oauthTokenSecret: this.options.oauthTokenSecret,
    }).generate()
  }

  /**
   * Make a signed request to the authorization server. The request follows
   * the Oauth1 spec and generates the Authorization header using the
   * [[Oauth1Signature]] class.
   */
  private async makeSignedRequest(
    event: 'requestToken' | 'accessToken',
    baseUrl: string,
    callback?: (request: ApiRequestContract) => void
  ) {
    const httpClient = new HttpClient(baseUrl)

    /**
     * Define the 'oauth_callback' callback param. Only the first request for
     * temporary credentials sets this
     */
    if (event === 'requestToken') {
      httpClient.oauth1Param('oauth_callback', this.options.callbackUrl)
      this.configureRequestTokenRequest(httpClient)
    } else {
      this.configureAccessTokenRequest(httpClient)
    }

    /**
     * Invoke callback to allow configuring request
     */
    if (typeof callback === 'function') {
      callback(httpClient)
    }

    /**
     * Generate oauth header
     */
    const { oauthHeader } = this.getSignature(baseUrl, {
      ...httpClient.params,
      ...httpClient.oauth1Params,
      /**
       * Send request body when is urlencoded
       * https://oauth1.wp-api.org/docs/basics/Signing.html#json-data
       */
      ...(httpClient.requestType === 'urlencoded' ? httpClient.fields : {}),
    })

    /**
     * Set the oauth header
     */
    httpClient.header('Authorization', `OAuth ${oauthHeader}`)

    /**
     * Make HTTP request
     */
    const response = await httpClient.post()
    return this.processClientResponse(event, httpClient, response)
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
  protected processClientResponse(
    _: 'requestToken' | 'accessToken',
    client: HttpClient,
    response: any
  ): any {
    /**
     * Return json as it is when parsed response as json
     */
    if (client.responseType === 'json') {
      return response
    }

    return parse(client.responseType === 'buffer' ? response.toString() : response)
  }

  /**
   * Verify state and the input value and raise exception if different or missing
   */
  public verifyState(state: string, inputValue?: string) {
    if (!state || state !== inputValue) {
      throw OauthException.stateMisMatch()
    }
  }

  /**
   * Returns the oauth token and secret for the upcoming requests
   */
  public async getRequestToken(
    callback?: (request: ApiRequestContract) => void
  ): Promise<Oauth1RequestToken> {
    const {
      oauth_token: oauthToken,
      oauth_token_secret: oauthTokenSecret,
      ...parsed
    } = await this.makeSignedRequest('requestToken', this.options.requestTokenUrl, callback)

    /**
     * We expect the response to have "oauth_token" and "oauth_token_secret"
     */
    if (!oauthToken || !oauthTokenSecret) {
      throw OauthException.missingTokenAndSecret(parsed)
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
  public getRedirectUrl(
    callback?: (request: RedirectRequestContract) => void
  ): string | Promise<string> {
    const urlBuilder = new UrlBuilder(this.options.authorizeUrl)

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
   * Get the access token from the oauth_verifier code. One must define
   * the "oauth_verifier" code using the callback input.
   *
   * ```ts
   * client.getAccessToken((request) => {
   *   request.oauth1Param('oauth_verifier', verifierValue)
   * })
   * ```
   */
  public async getAccessToken(callback?: (request: ApiRequestContract) => void): Promise<Token> {
    /**
     * Even though the spec allows to generate access token without the "oauthTokenSecret".
     * We enforce both the "oauthToken" and "oauthTokenSecret" to exist. This ensures
     * better security
     */
    if (!this.options.oauthToken) {
      throw new Error('"oauthToken" is required to generate the access token')
    }
    if (!this.options.oauthTokenSecret) {
      throw new Error('"oauthTokenSecret" is required to generate the access token')
    }

    /**
     * Make signed request.
     */
    const {
      oauth_token: accessOauthToken,
      oauth_token_secret: accessOauthTokenSecret,
      ...parsed
    } = await this.makeSignedRequest('accessToken', this.options.accessTokenUrl, callback)

    /**
     * We expect the response to have "oauth_token" and "oauth_token_secret"
     */
    if (!accessOauthToken || !accessOauthTokenSecret) {
      throw OauthException.missingTokenAndSecret(parsed)
    }

    return {
      token: accessOauthToken as string,
      secret: accessOauthTokenSecret as string,
      ...parsed,
    }
  }

  /**
   * Create a new instance of the "Oauth1Client"
   */
  public child(options: Oauth1ClientConfig) {
    return new Oauth1Client(options)
  }
}
