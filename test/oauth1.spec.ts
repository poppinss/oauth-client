/*
 * @adonisjs/ally
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import nock from 'nock'
import { escape } from 'querystring'
import { Oauth1Client } from '../src/Clients/Oauth1'

test.group('Oauth1Client | request token', () => {
  test('make request for the oauth server with the correct auth header', async (assert) => {
    assert.plan(8)

    nock('https://www.twitter.com')
      .post('/request_token')
      .reply(function () {
        const authorization = this.req.headers.authorization.replace('OAuth ', '').split(',')
        const payload = authorization.reduce((result: Record<string, string>, token: string) => {
          const [key, value] = token.split('=')
          result[key] = value.slice(1).slice(0, -1)
          return result
        }, {})

        assert.property(payload, 'oauth_consumer_key')
        assert.property(payload, 'oauth_nonce')
        assert.property(payload, 'oauth_signature')
        assert.property(payload, 'oauth_timestamp')
        assert.equal(payload.oauth_version, '1.0')
        assert.equal(payload.oauth_signature_method, 'HMAC-SHA1')

        return [200, 'oauth_token=1&oauth_token_secret=foo']
      })

    const request = new Oauth1Client({
      requestTokenUrl: 'https://www.twitter.com/request_token',
      callbackUrl: '',
      authorizeUrl: '',
      accessTokenUrl: '',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    const token = await request.getRequestToken()
    assert.equal(token.token, '1')
    assert.equal(token.secret, 'foo')
  })

  test('pass extra oauth params to the oauth server', async (assert) => {
    assert.plan(9)

    nock('https://www.twitter.com')
      .post('/request_token')
      .reply(function () {
        const authorization = this.req.headers.authorization.replace('OAuth ', '').split(',')
        const payload = authorization.reduce((result: Record<string, string>, token: string) => {
          const [key, value] = token.split('=')
          result[key] = value.slice(1).slice(0, -1)
          return result
        }, {})

        assert.property(payload, 'oauth_consumer_key')
        assert.property(payload, 'oauth_nonce')
        assert.property(payload, 'oauth_signature')
        assert.property(payload, 'oauth_timestamp')
        assert.equal(payload.oauth_version, '1.0')
        assert.equal(payload.oauth_signature_method, 'HMAC-SHA1')
        assert.equal(payload.oauth_callback, escape('http://localhost:3000'))

        return [200, 'oauth_token=1&oauth_token_secret=foo']
      })

    const request = new Oauth1Client({
      requestTokenUrl: 'https://www.twitter.com/request_token',
      callbackUrl: '',
      authorizeUrl: '',
      accessTokenUrl: '',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    const token = await request.getRequestToken((req) => {
      req.oauth1Param('oauth_callback', 'http://localhost:3000')
    })
    assert.equal(token.token, '1')
    assert.equal(token.secret, 'foo')
  })

  test('throw error when response type is not urlencoded', async (assert) => {
    assert.plan(8)

    nock('https://www.twitter.com')
      .post('/request_token')
      .reply(function () {
        const authorization = this.req.headers.authorization.replace('OAuth ', '').split(',')
        const payload = authorization.reduce((result: Record<string, string>, token: string) => {
          const [key, value] = token.split('=')
          result[key] = value.slice(1).slice(0, -1)
          return result
        }, {})

        assert.property(payload, 'oauth_consumer_key')
        assert.property(payload, 'oauth_nonce')
        assert.property(payload, 'oauth_signature')
        assert.property(payload, 'oauth_timestamp')
        assert.equal(payload.oauth_version, '1.0')
        assert.equal(payload.oauth_signature_method, 'HMAC-SHA1')
        assert.equal(payload.oauth_callback, escape('http://localhost:3000'))

        return [200, { hello: 'world' }]
      })

    const request = new Oauth1Client({
      requestTokenUrl: 'https://www.twitter.com/request_token',
      callbackUrl: '',
      authorizeUrl: '',
      accessTokenUrl: '',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    try {
      await request.getRequestToken((req) => {
        req.oauth1Param('oauth_callback', 'http://localhost:3000')
      })
    } catch (error) {
      assert.equal(
        error.message,
        'E_OAUTH_MISSING_TOKEN: Invalid oauth1 response. Missing "oauth_token" and "oauth_token_secret"'
      )
    }
  })

  test('throw error when oauth_token is missing', async (assert) => {
    assert.plan(8)

    nock('https://www.twitter.com')
      .post('/request_token')
      .reply(function () {
        const authorization = this.req.headers.authorization.replace('OAuth ', '').split(',')
        const payload = authorization.reduce((result: Record<string, string>, token: string) => {
          const [key, value] = token.split('=')
          result[key] = value.slice(1).slice(0, -1)
          return result
        }, {})

        assert.property(payload, 'oauth_consumer_key')
        assert.property(payload, 'oauth_nonce')
        assert.property(payload, 'oauth_signature')
        assert.property(payload, 'oauth_timestamp')
        assert.equal(payload.oauth_version, '1.0')
        assert.equal(payload.oauth_signature_method, 'HMAC-SHA1')
        assert.equal(payload.oauth_callback, escape('http://localhost:3000'))

        return [200, '']
      })

    const request = new Oauth1Client({
      requestTokenUrl: 'https://www.twitter.com/request_token',
      callbackUrl: '',
      authorizeUrl: '',
      accessTokenUrl: '',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    try {
      await request.getRequestToken((req) => {
        req.oauth1Param('oauth_callback', 'http://localhost:3000')
      })
    } catch (error) {
      assert.equal(
        error.message,
        'E_OAUTH_MISSING_TOKEN: Invalid oauth1 response. Missing "oauth_token" and "oauth_token_secret"'
      )
    }
  })

  test('throw error when oauth_token_secret is missing', async (assert) => {
    assert.plan(8)

    nock('https://www.twitter.com')
      .post('/request_token')
      .reply(function () {
        const authorization = this.req.headers.authorization.replace('OAuth ', '').split(',')
        const payload = authorization.reduce((result: Record<string, string>, token: string) => {
          const [key, value] = token.split('=')
          result[key] = value.slice(1).slice(0, -1)
          return result
        }, {})

        assert.property(payload, 'oauth_consumer_key')
        assert.property(payload, 'oauth_nonce')
        assert.property(payload, 'oauth_signature')
        assert.property(payload, 'oauth_timestamp')
        assert.equal(payload.oauth_version, '1.0')
        assert.equal(payload.oauth_signature_method, 'HMAC-SHA1')
        assert.equal(payload.oauth_callback, escape('http://localhost:3000'))

        return [200, 'oauth_token=1']
      })

    const request = new Oauth1Client({
      requestTokenUrl: 'https://www.twitter.com/request_token',
      callbackUrl: '',
      authorizeUrl: '',
      accessTokenUrl: '',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    try {
      await request.getRequestToken((req) => {
        req.oauth1Param('oauth_callback', 'http://localhost:3000')
      })
    } catch (error) {
      assert.equal(
        error.message,
        'E_OAUTH_MISSING_TOKEN: Invalid oauth1 response. Missing "oauth_token" and "oauth_token_secret"'
      )
    }
  })

  test('pass query string to the oauth server', async (assert) => {
    assert.plan(9)

    nock('https://www.twitter.com')
      .post('/request_token')
      .query(true)
      .reply(function () {
        const authorization = this.req.headers.authorization.replace('OAuth ', '').split(',')
        const payload = authorization.reduce((result: Record<string, string>, token: string) => {
          const [key, value] = token.split('=')
          result[key] = value.slice(1).slice(0, -1)
          return result
        }, {})

        assert.property(payload, 'oauth_consumer_key')
        assert.property(payload, 'oauth_nonce')
        assert.property(payload, 'oauth_signature')
        assert.property(payload, 'oauth_timestamp')
        assert.equal(payload.oauth_version, '1.0')
        assert.equal(payload.oauth_signature_method, 'HMAC-SHA1')
        assert.equal(this.req['options'].searchParams.get('redirect_url'), 'http://localhost:3000')
        return [200, 'oauth_token=1&oauth_token_secret=foo']
      })

    const request = new Oauth1Client({
      requestTokenUrl: 'https://www.twitter.com/request_token',
      callbackUrl: '',
      authorizeUrl: '',
      accessTokenUrl: '',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    const token = await request.getRequestToken((req) => {
      req.param('redirect_url', 'http://localhost:3000')
    })
    assert.equal(token.token, '1')
    assert.equal(token.secret, 'foo')
  })
})

test.group('Oauth1Request | access token', () => {
  test('make request to get the access token', async (assert) => {
    assert.plan(9)

    nock('https://www.twitter.com')
      .post('/access_token')
      .reply(function () {
        const authorization = this.req.headers.authorization.replace('OAuth ', '').split(',')
        const payload = authorization.reduce((result: Record<string, string>, token: string) => {
          const [key, value] = token.split('=')
          result[key] = value.slice(1).slice(0, -1)
          return result
        }, {})

        assert.property(payload, 'oauth_consumer_key')
        assert.property(payload, 'oauth_nonce')
        assert.property(payload, 'oauth_signature')
        assert.property(payload, 'oauth_timestamp')
        assert.equal(payload.oauth_version, '1.0')
        assert.equal(payload.oauth_signature_method, 'HMAC-SHA1')
        assert.equal(payload.oauth_token, 'foo')

        return [200, 'oauth_token=1&oauth_token_secret=foo']
      })

    const request = new Oauth1Client({
      requestTokenUrl: '',
      callbackUrl: '',
      authorizeUrl: '',
      accessTokenUrl: 'https://www.twitter.com/access_token',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    const token = await request.getAccessToken({
      token: 'foo',
      secret: 'bar',
    })
    assert.equal(token.token, '1')
    assert.equal(token.secret, 'foo')
  })
})
