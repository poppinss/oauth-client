/*
 * @poppinss/oauth-client
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { createError, Exception } from '@poppinss/utils'

/**
 * Raised when unable to get access token for oauth2 or oauth token and secret
 * for oauth1
 */
export const E_OAUTH_MISSING_TOKEN = class MissingTokenException extends Exception {
  static status = 400
  static code = 'E_OAUTH_MISSING_TOKEN'
  static oauth2Message = 'Invalid oauth2 response. Missing "access_token"'
  static oauth1Message = 'Invalid oauth1 response. Missing "oauth_token" and "oauth_token_secret"'
}

/**
 * Raised when unable to verify the CSRF state post redirect
 */
export const E_OAUTH_STATE_MISMATCH = createError(
  'Unable to verify re-redirect state',
  'E_OAUTH_STATE_MISMATCH',
  400
)
