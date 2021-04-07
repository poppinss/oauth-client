/*
 * @poppinss/oauth-client
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import querystring from 'querystring'

/**
 * Builds the url with query string
 */
export class UrlBuilder {
  public params: Record<string, any> = {}

  constructor(private baseUrl: string) {}

  /**
   * Define the request param
   */
  public param(key: string, value: any) {
    this.params[key] = value
    return this
  }

  /**
   * Clear a specific param
   */
  public clearParam(key: string): this {
    delete this.params[key]
    return this
  }

  /**
   * Clear all params
   */
  public clear() {
    this.params = {}
    return this
  }

  /**
   * Returns the url
   */
  public makeUrl() {
    const qs = querystring.stringify(this.params)
    return `${this.baseUrl.replace(/\/$/, '')}${qs ? `?${qs}` : ''}`
  }
}
