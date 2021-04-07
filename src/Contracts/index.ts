/*
 * @poppinss/oauth-client
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { DateTime } from 'luxon'

export type KnownFields = 'grant_type' | 'redirect_uri' | 'client_id' | 'client_secret' | 'code'
export type KnownParams = 'client_id' | 'redirect_uri' | 'oauth_token'
export type KnownOauth1Params = 'oauth_verifier'
export type KnownHeaders = 'Authorization'

/**
 * ---------------------------------------------------
 * Independent types
 * ---------------------------------------------------
 */

/**
 * Base request for making the redirect URL
 */
export interface RedirectRequestContract {
  params: Record<string, any>

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
  params: Record<string, any>
  headers: Record<string, any>
  fields: Record<string, any>
  oauth1Params: Record<string, any>

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
   * Refresh token
   */
  refreshToken?: string

  /**
   * Static time in seconds when the token will expire
   */
  expiresIn?: number

  /**
   * Timestamp at which the token expires
   */
  expiresAt?: DateTime
} & Record<string, any>

/**
 * Base config for Oauth2.0 client
 */
export type Oauth2ClientConfig = {
  clientId: string
  clientSecret: string
  callbackUrl: string
  authorizeUrl?: string
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
   * Url for getting the oauthToken and secret before the redirect
   */
  requestTokenUrl?: string

  /**
   * Required when requesting the access token. The initial request
   * contains the both, that must be saved inside cookies for later
   * use
   */
  oauthToken?: string
  oauthTokenSecret?: string
}
