/*
 * @poppinss/oauth-client
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import got, { CancelableRequest, Response } from 'got'

/**
 * An HTTP client abstraction we need for making Oauth requests
 */
export class HttpClient {
  public requestType: 'json' | 'urlencoded' = 'urlencoded'
  public responseType: 'json' | 'text' | 'buffer' = 'text'
  public params: Record<string, any> = {}
  public fields: Record<string, any> = {}
  public headers: Record<string, any> = {}
  public oauth1Params: Record<string, any> = {}

  constructor(private baseUrl: string) {}

  /**
   * Returns the got options for the request
   */
  private getGotOptions(requestMethod: 'GET' | 'POST') {
    const hasBody = Object.keys(this.fields).length > 0
    return {
      ...(hasBody
        ? this.requestType === 'json'
          ? { json: this.fields }
          : { form: this.fields }
        : {}),
      searchParams: this.params,
      allowGetBody: requestMethod === 'GET' && hasBody,
      headers: this.headers,
    }
  }

  /**
   * Returns the response body of the got instance
   */
  private getResponseBody(request: CancelableRequest<Response>) {
    if (this.responseType === 'json') {
      return request.json()
    }

    if (this.responseType === 'text') {
      return request.text()
    }

    return request.buffer()
  }

  /**
   * Define query string param
   */
  public param(key: string, value: any): this {
    this.params[key] = value
    return this
  }

  /**
   * Remove a named param
   */
  public clearParam(key: string): this {
    delete this.params[key]
    return this
  }

  /**
   * Define an oauth1 param that makes it way to the Authorization
   * header
   */
  public oauth1Param(key: string, value: any): this {
    this.oauth1Params[key] = value
    return this
  }

  /**
   * Remove a named oauth1Param
   */
  public clearOauth1Param(key: string): this {
    delete this.oauth1Params[key]
    return this
  }

  /**
   * Define request body
   */
  public field(key: string, value: any): this {
    this.fields[key] = value
    return this
  }

  /**
   * Remove a field by its name
   */
  public clearField(key: string): this {
    delete this.fields[key]
    return this
  }

  /**
   * Define request header
   */
  public header(key: string, value: any): this {
    this.headers[key] = value
    return this
  }

  /**
   * Remove a header by its name
   */
  public clearHeader(key: string): this {
    delete this.headers[key]
    return this
  }

  /**
   * Set the request content type using a shortcut.
   */
  public sendAs(type: 'json' | 'urlencoded'): this {
    this.requestType = type
    return this
  }

  /**
   * Define how to parse the response
   */
  public parseAs(type: 'json' | 'text' | 'buffer'): this {
    this.responseType = type
    return this
  }

  /**
   * Reset the client state
   */
  public clear(): this {
    this.requestType = 'urlencoded'
    this.responseType = 'text'
    this.params = {}
    this.fields = {}
    this.headers = {}
    this.oauth1Params = {}
    return this
  }

  /**
   * Make a post request
   */
  public async post(): Promise<any> {
    return this.getResponseBody(got.post(this.baseUrl, this.getGotOptions('POST')))
  }

  /**
   * Make a get request
   */
  public async get(): Promise<any> {
    return this.getResponseBody(got.get(this.baseUrl, this.getGotOptions('GET')))
  }
}
