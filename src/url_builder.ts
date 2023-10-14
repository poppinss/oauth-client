/*
 * @poppinss/oauth-client
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { RedirectRequestContract } from './types.js'

/**
 * Fluent API to constructor a URL with query string
 */
export class UrlBuilder implements RedirectRequestContract {
  #url: URL

  constructor(baseUrl: string) {
    this.#url = new URL(baseUrl)
  }

  /**
   * Returns URL params as an object
   */
  getParams() {
    const params: Record<string, any> = {}
    for (const [key, value] of this.#url.searchParams.entries()) {
      params[key] = value
    }

    return params
  }

  /**
   * Define the request param
   */
  param(key: string, value: any) {
    this.#url.searchParams.append(key, value)
    return this
  }

  /**
   * Clear a specific param
   */
  clearParam(key: string): this {
    this.#url.searchParams.delete(key)
    return this
  }

  /**
   * Clear all params
   */
  clear() {
    Array.from(this.#url.searchParams.keys()).forEach((key) => this.clearParam(key))
    return this
  }

  /**
   * Returns the url
   */
  makeUrl() {
    return this.#url.toString()
  }
}
