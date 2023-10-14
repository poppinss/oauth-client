/*
 * @poppinss/oauth-client
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export type KnownHeaders = 'Authorization'
export type KnownOauth1Params = 'oauth_verifier'
export type KnownParams = 'client_id' | 'redirect_uri' | 'oauth_token'
export type KnownFields = 'grant_type' | 'redirect_uri' | 'client_id' | 'client_secret' | 'code'

/**
 * Base request for making the redirect URL
 */
export interface RedirectRequestContract {
  /**
   * Returns an object of query string params set using
   * the "param" method
   */
  getParams(): Record<string, any>

  /**
   * Define query string param
   */
  param(key: KnownParams, value: any): this
  param(key: string, value: any): this

  /**
   * Clear existing param
   */
  clearParam(key: KnownParams): this
  clearParam(key: string): this

  /**
   * Clear request internal state
   */
  clear(): this
}

/**
 * Base request for configuring an API call. The client itself decides if it
 * wants to make a `POST` call or a `PUT` call. The user is just given the
 * option to configure other values.
 */
export interface ApiRequestContract {
  /**
   * Returns an object of query string params set using
   * the "param" method
   */
  getParams(): Record<string, any>

  /**
   * Returns an object of request headers set using
   * the "header" method
   */
  getHeaders(): Record<string, any>

  /**
   * Returns an object of request form fields set using
   * the "field" method
   */
  getFields(): Record<string, any>

  /**
   * Returns an object of oauth1 signature params set using
   * the "oauth1Param" method
   */
  getOauth1Params(): Record<string, any>

  /**
   * Define how to parse the response
   */
  parseAs(type: 'json' | 'text' | 'buffer'): this

  /**
   * Define query string param
   */
  param(key: KnownParams, value: any): this
  param(key: string, value: any): this

  /**
   * Clear existing param
   */
  clearParam(key: KnownParams): this
  clearParam(key: string): this

  /**
   * Define oauth1Param. The value is not defined in the query string
   * but used for make the base string for the Authorization header
   */
  oauth1Param(key: KnownOauth1Params | string, value: any): this
  oauth1Param(key: string, value: any): this

  /**
   * Clear oauth param by name
   */
  clearOauth1Param(key: KnownOauth1Params): this
  clearOauth1Param(key: string): this

  /**
   * Define a custom HTTP header for the request
   */
  header(key: KnownHeaders, value: any): this
  header(key: string, value: any): this

  /**
   * Clear header by its name
   */
  clearHeader(key: KnownHeaders): this
  clearHeader(key: string): this

  /**
   * Define a form field
   */
  field(key: KnownFields, value: any): this
  field(key: string, value: any): this

  /**
   * Clear field by its name
   */
  clearField(key: KnownFields): this
  clearField(key: string): this

  /**
   * Clear request internal state
   */
  clear(): this
}

/**
 * ---------------------------------------------------
 * Oauth2 Types
 * ---------------------------------------------------
 */

/**
 * Base Oauth2 token when client is unknown
 */
export type Oauth2AccessToken = {
  /**
   * Value of the token
   */
  token: string

  /**
   * Token type
   */
  type: string

  /**
   * Refresh token (not all servers returns refresh token)
   */
  refreshToken?: string

  /**
   * Static time in seconds when the token will expire. Usually
   * exists, when there is a refresh token
   */
  expiresIn?: number

  /**
   * Timestamp at which the token expires. Usually
   * exists, when there is a refresh token
   */
  expiresAt?: Date
} & Record<string, any>

/**
 * Base config for Oauth2.0 client
 */
export type Oauth2ClientConfig = {
  /**
   * Client id must be obtained by the authorization server.
   */
  clientId: string

  /**
   * Client secret must be obtained by the authorization server.
   */
  clientSecret: string

  /**
   * Callback URL to your server to handle the response after
   * a user allows or rejects the OAuth request
   */
  callbackUrl: string

  /**
   * The authorization server URL where the user should be
   * redirected for the login consent.
   */
  authorizeUrl?: string

  /**
   * The authorization server access token URL from where to exchange
   * an access token post redirect.
   */
  accessTokenUrl?: string
}

/**
 * ---------------------------------------------------
 * OAuth1 Types
 * ---------------------------------------------------
 */

/**
 * Shape of the oauth1 request token response
 */
export type Oauth1RequestToken = {
  token: string
  secret: string
} & Record<string, any>

/**
 * Base Oauth1 token when client is unknown
 */
export type Oauth1AccessToken = Oauth1RequestToken

/**
 * Base config for the Oauth 1.0 client
 */
export type Oauth1ClientConfig = Oauth2ClientConfig & {
  /**
   * URL for getting the oauth token and secret before the redirect
   */
  requestTokenUrl?: string
}

/**
 * Options accepted by the Oauth1 signature builder
 */
export type Oauth1SignatureOptions = {
  consumerKey: string
  consumerSecret: string
  method: string
  url: string
  nonce: string
  unixTimestamp: number
  params?: any
  oauthToken?: string
  oauthTokenSecret?: string
}
