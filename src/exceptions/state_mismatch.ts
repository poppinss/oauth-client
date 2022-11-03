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
 * Raised when unable to verify the CSRF state post redirect
 */
export class StateMisMatchException extends Exception {
  static status = 400
  static code = 'E_OAUTH_STATE_MISMATCH'
  static message = 'Unable to verify re-redirect state'
}
