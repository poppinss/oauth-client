/*
 * @poppinss/oauth-client
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import nock from 'nock'
import { DateTime } from 'luxon'
import { test } from '@japa/runner'
import { parse } from 'node:querystring'
import { Oauth2Client } from '../src/clients/oauth2/main.js'

test.group('Oauth2Client | state', () => {
  test('generate a random state string', async ({ assert }) => {
    const request = new Oauth2Client({
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      callbackUrl: '',
      accessTokenUrl: '',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    assert.lengthOf(request.getState(), 32)
  })

  test('throw when state and input values are not the same', ({ assert }) => {
    const request = new Oauth2Client({
      callbackUrl: '',
      authorizeUrl: '',
      accessTokenUrl: '',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    assert.throws(() => request.verifyState('foo', 'bar'), 'Unable to verify re-redirect state')
  })
})

test.group('Oauth2Client | redirect url', () => {
  test('make redirect url', async ({ assert }) => {
    const request = new Oauth2Client({
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      callbackUrl: '',
      accessTokenUrl: '',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    const url = request.getRedirectUrl()
    assert.equal(
      url,
      'https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=&client_id=a-dummy-consumer-key'
    )
  })

  test('throw when authorize url is missing', async ({ assert }) => {
    const request = new Oauth2Client({
      authorizeUrl: '',
      callbackUrl: '',
      accessTokenUrl: '',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    assert.throws(
      () => request.getRedirectUrl(),
      'Missing "config.authorizeUrl". The property is required to make redirect url'
    )
  })

  test('modify redirect url params', async ({ assert }) => {
    const request = new Oauth2Client({
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      callbackUrl: '',
      accessTokenUrl: '',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    const url = request.getRedirectUrl((req) => req.param('grant_type', 'authorization_code'))
    assert.equal(
      url,
      'https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=&client_id=a-dummy-consumer-key&grant_type=authorization_code'
    )
  })
})

test.group('Oauth2Client | access token', () => {
  test('get access token from the authorization server', async ({ assert }) => {
    assert.plan(2)

    nock('https://oauth2.googleapis.com')
      .post('/token')
      .query({ code: '1234' })
      .reply(function (_, body) {
        assert.deepEqual(parse(body as string), {
          grant_type: 'authorization_code',
          redirect_uri: '',
          client_id: 'a-dummy-consumer-key',
          client_secret: 'a-dummy-consumer-secret',
        })

        return [200, { access_token: '1234', type: 'bearer' }]
      })

    const request = new Oauth2Client({
      authorizeUrl: '',
      callbackUrl: '',
      accessTokenUrl: 'https://oauth2.googleapis.com/token',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    const response = await request.getAccessToken((req) => req.param('code', '1234'))
    assert.containsSubset(response, { token: '1234', type: 'bearer' })
  })

  test('parse urlencoded response from the server', async ({ assert }) => {
    assert.plan(2)

    nock('https://oauth2.googleapis.com')
      .post('/token')
      .query({ code: '1234' })
      .reply(function (_, body) {
        assert.deepEqual(parse(body as string), {
          grant_type: 'authorization_code',
          redirect_uri: '',
          client_id: 'a-dummy-consumer-key',
          client_secret: 'a-dummy-consumer-secret',
        })

        return [200, 'access_token=1234&type=bearer']
      })

    const request = new Oauth2Client({
      authorizeUrl: '',
      callbackUrl: '',
      accessTokenUrl: 'https://oauth2.googleapis.com/token',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    const response = await request.getAccessToken((req) => {
      req.param('code', '1234')
      req.parseAs('text')
    })
    assert.containsSubset(response, { token: '1234', type: 'bearer' })
  })

  test('parse buffer response from the server', async ({ assert }) => {
    assert.plan(2)

    nock('https://oauth2.googleapis.com')
      .post('/token')
      .query({ code: '1234' })
      .reply(function (_, body) {
        assert.deepEqual(parse(body as string), {
          grant_type: 'authorization_code',
          redirect_uri: '',
          client_id: 'a-dummy-consumer-key',
          client_secret: 'a-dummy-consumer-secret',
        })

        return [200, Buffer.from('access_token=1234&type=bearer')]
      })

    const request = new Oauth2Client({
      authorizeUrl: '',
      callbackUrl: '',
      accessTokenUrl: 'https://oauth2.googleapis.com/token',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    const response = await request.getAccessToken((req) => {
      req.param('code', '1234')
      req.parseAs('buffer')
    })
    assert.containsSubset(response, { token: '1234', type: 'bearer' })
  })

  test('generate "expirestAt" luxon instance from "expiresIn" property', async ({ assert }) => {
    assert.plan(3)

    nock('https://oauth2.googleapis.com')
      .post('/token')
      .query({ code: '1234' })
      .reply(function (_, body) {
        assert.deepEqual(parse(body as string), {
          grant_type: 'authorization_code',
          redirect_uri: '',
          client_id: 'a-dummy-consumer-key',
          client_secret: 'a-dummy-consumer-secret',
        })

        return [200, { access_token: '1234', type: 'bearer', expires_in: 3600 }]
      })

    const request = new Oauth2Client({
      authorizeUrl: '',
      callbackUrl: '',
      accessTokenUrl: 'https://oauth2.googleapis.com/token',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    const response = await request.getAccessToken((req) => req.param('code', '1234'))
    assert.instanceOf(response.expiresAt, DateTime)
    assert.isAbove(response.expiresAt!.diffNow('seconds').seconds, 0)
  })

  test('raise error when authorization server does not return access token', async ({ assert }) => {
    assert.plan(2)

    nock('https://oauth2.googleapis.com')
      .post('/token')
      .query({ code: '1234' })
      .reply(function (_, body) {
        assert.deepEqual(parse(body as string), {
          grant_type: 'authorization_code',
          redirect_uri: '',
          client_id: 'a-dummy-consumer-key',
          client_secret: 'a-dummy-consumer-secret',
        })

        return [200, { type: 'bearer' }]
      })

    const request = new Oauth2Client({
      authorizeUrl: '',
      callbackUrl: '',
      accessTokenUrl: 'https://oauth2.googleapis.com/token',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    await assert.rejects(
      () => request.getAccessToken((req) => req.param('code', '1234')),
      'Invalid oauth2 response. Missing "access_token"'
    )
  })

  test('raise error when "config.accessTokenUrl" is missing', async ({ assert }) => {
    const request = new Oauth2Client({
      authorizeUrl: '',
      callbackUrl: '',
      accessTokenUrl: '',
      clientId: 'a-dummy-consumer-key',
      clientSecret: 'a-dummy-consumer-secret',
    })

    await assert.rejects(
      () => request.getAccessToken(),
      'Missing "config.accessTokenUrl". The property is required to get access token'
    )
  })
})
