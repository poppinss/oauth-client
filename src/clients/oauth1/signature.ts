/*
 * @poppinss/oauth-client
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { URL } from 'node:url'
import { createHmac } from 'node:crypto'
import { escape } from 'node:querystring'
import { Oauth1SignatureOptions } from '../../types.js'

/**
 * Creates the signature for the OAuth1 request by following the spec
 * https://tools.ietf.org/html/rfc5849#section-3.5.1
 * https://oauth.net/core/1.0a/#auth_step1
 */
export class Oauth1Signature {
  #options: Oauth1SignatureOptions

  constructor(options: Oauth1SignatureOptions) {
    this.#options = options
  }

  /**
   * Generate signature and the oauth header
   */
  generate() {
    /**
     * The oauth request params. They are used to generate
     * the signature
     */
    const params = {
      ...this.#options.params,
      ...(this.#options.oauthToken ? { oauth_token: this.#options.oauthToken } : {}),
      oauth_consumer_key: this.#options.consumerKey,
      oauth_nonce: this.#options.nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: this.#options.unixTimestamp,
      oauth_version: '1.0',
    }

    /**
     * Creates the params string as per https://tools.ietf.org/html/rfc5849#section-3.5.1
     */
    const orderedParamsString = Object.entries(params)
      .map((entry) => entry.map((key) => escape(String(key))).join('='))
      .sort()
      .join('&')

    /**
     * Constructing a URL and converting it to a string will remove the standard
     * port if defined.
     *
     * For example:
     *
     * Input: https://example.com:443/wp-json/wp/v2/posts
     * Output: https://example.com/wp-json/wp/v2/posts
     *
     * Input: http://example.com:80/wp-json/wp/v2/posts
     * Output: http://example.com/wp-json/wp/v2/posts
     *
     */
    const url = new URL(this.#options.url).toString()

    /**
     * Creates the base string as per https://oauth1.wp-api.org/docs/basics/Signing.html#base-string
     */
    const baseString = [
      this.#options.method.toUpperCase(),
      escape(url),
      escape(orderedParamsString),
    ].join('&')

    /**
     * Generate signing secret
     * https://oauth1.wp-api.org/docs/basics/Signing.html#signature-key
     */
    let signatureKey = `${escape(this.#options.consumerSecret)}&`
    if (this.#options.oauthTokenSecret) {
      signatureKey = `${signatureKey}${escape(this.#options.oauthTokenSecret)}`
    }

    const signature = createHmac('SHA1', signatureKey).update(baseString, 'utf8').digest('base64')

    /**
     * A collection of `oauth_` params. They should be sent using the Authorization
     * header
     */
    const oauthParams = Object.keys(params).reduce<{ [key: string]: string | number | boolean }>(
      (result, key) => {
        if (key.startsWith('oauth_')) {
          result[key] = params[key]
        }

        return result
      },
      { oauth_signature: signature }
    )

    return {
      params: params,
      oauthParams: oauthParams,
      oauthHeader: Object.entries(oauthParams)
        .map((entry) => {
          // encoding key and value separately as per https://tools.ietf.org/html/rfc5849#section-3.5.1
          return `${escape(entry[0])}="${escape(String(entry[1]))}"`
        })
        .sort()
        .join(','),
      signature,
    }
  }
}
