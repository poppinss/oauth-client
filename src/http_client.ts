/*
 * @poppinss/oauth-client
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import got, { type CancelableRequest, type Response } from 'got'
import type { ApiRequestContract } from './types.js'

/**
 * An HTTP client abstraction we need for making OAuth requests
 */
export class HttpClient implements ApiRequestContract {
  #baseUrl: string
  #params: Record<string, any> = {}
  #fields: Record<string, any> = {}
  #headers: Record<string, any> = {}
  #oauth1Params: Record<string, any> = {}
  #requestType: 'json' | 'urlencoded' = 'urlencoded'
  #responseType: 'json' | 'text' | 'buffer' = 'text'

  constructor(baseUrl: string) {
    this.#baseUrl = baseUrl
  }

  /**
   * Returns the got options for the request
   */
  #getGotOptions(requestMethod: 'GET' | 'POST') {
    const hasBody = Object.keys(this.#fields).length > 0
    return {
      ...(hasBody
        ? this.#requestType === 'json'
          ? { json: this.#fields }
          : { form: this.#fields }
        : {}),
      searchParams: this.#params,
      allowGetBody: requestMethod === 'GET' && hasBody,
      headers: this.#headers,
    }
  }

  /**
   * Returns the response body of the got instance
   */
  #getResponseBody(request: CancelableRequest<Response>) {
    if (this.#responseType === 'json') {
      return request.json()
    }

    if (this.#responseType === 'text') {
      return request.text()
    }

    return request.buffer()
  }

  /**
   * Get access to request query params
   */
  getParams(): Record<string, any> {
    return this.#params
  }

  /**
   * Get access to request headers
   */
  getHeaders(): Record<string, any> {
    return this.#headers
  }

  /**
   * Get access to request body fields
   */
  getFields(): Record<string, any> {
    return this.#fields
  }

  /**
   * Get access to request oAuth1 params
   */
  getOauth1Params(): Record<string, any> {
    return this.#oauth1Params
  }

  /**
   * Get the request type
   */
  getRequestType() {
    return this.#requestType
  }

  /**
   * Get the type of the desired response type
   */
  getResponseType() {
    return this.#responseType
  }

  /**
   * Define query string param
   */
  param(key: string, value: any): this {
    this.#params[key] = value
    return this
  }

  /**
   * Remove a named param
   */
  clearParam(key: string): this {
    delete this.#params[key]
    return this
  }

  /**
   * Define an oauth1 param that makes it way to the Authorization
   * header
   */
  oauth1Param(key: string, value: any): this {
    this.#oauth1Params[key] = value
    return this
  }

  /**
   * Remove a named oauth1Param
   */
  clearOauth1Param(key: string): this {
    delete this.#oauth1Params[key]
    return this
  }

  /**
   * Define request body
   */
  field(key: string, value: any): this {
    this.#fields[key] = value
    return this
  }

  /**
   * Remove a field by its name
   */
  clearField(key: string): this {
    delete this.#fields[key]
    return this
  }

  /**
   * Define request header
   */
  header(key: string, value: any): this {
    this.#headers[key] = value
    return this
  }

  /**
   * Remove a header by its name
   */
  clearHeader(key: string): this {
    delete this.#headers[key]
    return this
  }

  /**
   * Set the request content type using a shortcut.
   */
  sendAs(type: 'json' | 'urlencoded'): this {
    this.#requestType = type
    return this
  }

  /**
   * Define how to parse the response
   */
  parseAs(type: 'json' | 'text' | 'buffer'): this {
    this.#responseType = type
    return this
  }

  /**
   * Reset the client state
   */
  clear(): this {
    this.#requestType = 'urlencoded'
    this.#responseType = 'text'
    this.#params = {}
    this.#fields = {}
    this.#headers = {}
    this.#oauth1Params = {}
    return this
  }

  /**
   * Make a post request
   */
  async post(): Promise<any> {
    return this.#getResponseBody(got.post(this.#baseUrl, this.#getGotOptions('POST')))
  }

  /**
   * Make a get request
   */
  async get(): Promise<any> {
    return this.#getResponseBody(got.get(this.#baseUrl, this.#getGotOptions('GET')))
  }
}
