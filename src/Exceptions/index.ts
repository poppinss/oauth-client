/*
 * @poppinss/oauth-client
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Exception } from '../utils'

export class OauthException extends Exception {
  public response: any

  /**
   * Unable to verify state after redirect
   */
  public static stateMisMatch() {
    return new this('Unable to verify re-redirect state', 400, 'E_OAUTH_STATE_MISMATCH')
  }

  /**
   * Access token response is missing the access token property
   */
  public static missingAccessToken(response: any) {
    const exception = new this(
      'Invalid oauth2 response. Missing "access_token"',
      400,
      'E_OAUTH_MISSING_TOKEN'
    )

    exception.response = response
    return exception
  }

  /**
   * Oauth token request is missing the token or secret
   */
  public static missingTokenAndSecret(response: any) {
    const exception = new this(
      `Invalid oauth1 response. Missing "oauth_token" and "oauth_token_secret"`,
      400,
      'E_OAUTH_MISSING_TOKEN'
    )

    exception.response = response
    return exception
  }
}
