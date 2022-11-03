/*
 * @poppinss/oauth-client
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Exception } from '@poppinss/utils'

/**
 * Raised when unable to get access token for oauth2 or oauth token and secret
 * for oauth1
 */
export class MissingTokenException extends Exception {
  static status = 400
  static code = 'E_OAUTH_MISSING_TOKEN'
  static oauth2Message = 'Invalid oauth2 response. Missing "access_token"'
  static oauth1Message = 'Invalid oauth1 response. Missing "oauth_token" and "oauth_token_secret"'
}
