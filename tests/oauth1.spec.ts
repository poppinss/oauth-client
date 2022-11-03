/*
 * @poppinss/oauth-client
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import nock from 'nock'
import { test } from '@japa/runner'
import { escape } from 'node:querystring'
import { Oauth1Client } from '../src/clients/oauth1/main.js'

test.group('Oauth1Client | verify state', () => {
  test('throw when state and input values are not the same', ({ assert }) => {
    const request = new Oauth1Client({
      requestTokenUrl: 'https://www.twitter.com/request_token',
      callbackUrl: '',
      authorizeUrl: '',
      accessTokenUrl: '',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    assert.throws(() => request.verifyState('foo', 'bar'), 'Unable to verify re-redirect state')
  })
})

test.group('Oauth1Client | request token', () => {
  test('make request for the oauth server with the correct auth header', async ({ assert }) => {
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
  test('pass extra oauth params to the oauth server', async ({ assert }) => {
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

  test('throw error when response type is not urlencoded', async ({ assert }) => {
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
        'Invalid oauth1 response. Missing "oauth_token" and "oauth_token_secret"'
      )
    }
  })

  test('throw error when oauth_token is missing', async ({ assert }) => {
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
        'Invalid oauth1 response. Missing "oauth_token" and "oauth_token_secret"'
      )
    }
  })

  test('throw error when oauth_token_secret is missing', async ({ assert }) => {
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
        'Invalid oauth1 response. Missing "oauth_token" and "oauth_token_secret"'
      )
    }
  })

  test('throw error when "config.requestTokenUrl" is missing', async ({ assert }) => {
    const request = new Oauth1Client({
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
        'Missing "config.requestTokenUrl". The property is required to get request token'
      )
    }
  })

  test('pass query string to the oauth server', async ({ assert }) => {
    assert.plan(9)

    nock('https://www.twitter.com')
      .post('/request_token')
      .query(true)
      .reply(function (uri) {
        const authorization = this.req.headers.authorization.replace('OAuth ', '').split(',')
        const payload = authorization.reduce((result: Record<string, string>, token: string) => {
          const [key, value] = token.split('=')
          result[key] = value.slice(1).slice(0, -1)
          return result
        }, {})

        const { searchParams } = new URL(uri, `https://${this.req.headers.host}`)

        assert.property(payload, 'oauth_consumer_key')
        assert.property(payload, 'oauth_nonce')
        assert.property(payload, 'oauth_signature')
        assert.property(payload, 'oauth_timestamp')
        assert.equal(payload.oauth_version, '1.0')
        assert.equal(payload.oauth_signature_method, 'HMAC-SHA1')
        assert.equal(searchParams.get('redirect_url'), 'http://localhost:3000')
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

test.group('Oauth1Client | redirect url', () => {
  test('make redirect url', async ({ assert }) => {
    assert.plan(7)

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
      authorizeUrl: 'https://api.twitter.com/oauth/authenticate',
      accessTokenUrl: '',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    const token = await request.getRequestToken()
    const redirectUrl = request.getRedirectUrl((req) => req.param('oauth_token', token.token))
    assert.equal(
      redirectUrl,
      `https://api.twitter.com/oauth/authenticate?oauth_token=${token.token}`
    )
  })

  test('throw when "config.authorizeUrl" is missing', async ({ assert }) => {
    assert.plan(7)

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
    assert.throws(
      () => request.getRedirectUrl((req) => req.param('oauth_token', token.token)),
      'Missing "config.authorizeUrl". The property is required to make redirect url'
    )
  })
})

test.group('Oauth1Request | access token', () => {
  test('make request to get the access token', async ({ assert }) => {
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

  test('throw error when "requestToken.token" is missing', async ({ assert }) => {
    const request = new Oauth1Client({
      requestTokenUrl: '',
      callbackUrl: '',
      authorizeUrl: '',
      accessTokenUrl: 'https://www.twitter.com/access_token',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    await assert.rejects(
      // @ts-expect-error
      () => request.getAccessToken({}),
      'Missing "requestToken.token". The property is required to generate access token'
    )
  })

  test('throw error when "requestToken.secret" is missing', async ({ assert }) => {
    const request = new Oauth1Client({
      requestTokenUrl: '',
      callbackUrl: '',
      authorizeUrl: '',
      accessTokenUrl: 'https://www.twitter.com/access_token',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    await assert.rejects(
      // @ts-expect-error
      () => request.getAccessToken({ token: 'a' }),
      'Missing "requestToken.secret". The property is required to generate access token'
    )
  })

  test('throw error when "config.accessTokenUrl" is missing', async ({ assert }) => {
    const request = new Oauth1Client({
      requestTokenUrl: '',
      callbackUrl: '',
      authorizeUrl: '',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    await assert.rejects(
      () => request.getAccessToken({ token: 'a', secret: '1' }),
      'Missing "config.accessTokenUrl". The property is required to generate access token'
    )
  })

  test('throw when response does not contain oauth_token or secret', async ({ assert }) => {
    assert.plan(8)

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

        return [200, 'oauth_token=1']
      })

    const request = new Oauth1Client({
      requestTokenUrl: '',
      callbackUrl: '',
      authorizeUrl: '',
      accessTokenUrl: 'https://www.twitter.com/access_token',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    await assert.rejects(
      () => request.getAccessToken({ token: 'foo', secret: '1' }),
      'Invalid oauth1 response. Missing "oauth_token" and "oauth_token_secret"'
    )
  })

  test('handle JSON response from the authorization server', async ({ assert }) => {
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

        return [200, { oauth_token: 'foo', oauth_token_secret: '1' }]
      })

    const request = new Oauth1Client({
      requestTokenUrl: '',
      callbackUrl: '',
      authorizeUrl: '',
      accessTokenUrl: 'https://www.twitter.com/access_token',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    const token = await request.getAccessToken(
      {
        token: 'foo',
        secret: 'bar',
      },
      (req) => req.parseAs('json')
    )
    assert.equal(token.token, 'foo')
    assert.equal(token.secret, '1')
  })

  test('handle buffer response from the authorization server', async ({ assert }) => {
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

        return [200, Buffer.from('oauth_token=1&oauth_token_secret=foo')]
      })

    const request = new Oauth1Client({
      requestTokenUrl: '',
      callbackUrl: '',
      authorizeUrl: '',
      accessTokenUrl: 'https://www.twitter.com/access_token',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    const token = await request.getAccessToken(
      {
        token: 'foo',
        secret: 'bar',
      },
      (req) => req.parseAs('buffer')
    )
    assert.equal(token.token, '1')
    assert.equal(token.secret, 'foo')
  })
})
