/*
 * @poppinss/oauth-client
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { UrlBuilder } from '../src/url_builder.js'

test.group('URL Builder', () => {
  test('create a url', ({ assert }) => {
    const builder = new UrlBuilder('http://foo.com')
    assert.equal(builder.makeUrl(), 'http://foo.com/')
  })

  test('create a url with query params', ({ assert }) => {
    const builder = new UrlBuilder('http://foo.com')
    builder.param('foo', 'bar')
    assert.equal(builder.makeUrl(), 'http://foo.com/?foo=bar')
  })

  test('delete params', ({ assert }) => {
    const builder = new UrlBuilder('http://foo.com')
    builder.param('foo', 'bar')
    builder.param('bar', 'baz')
    builder.clearParam('foo')
    assert.equal(builder.makeUrl(), 'http://foo.com/?bar=baz')
  })

  test('delete all params', ({ assert }) => {
    const builder = new UrlBuilder('http://foo.com')
    builder.param('foo', 'bar')
    builder.param('bar', 'baz')
    builder.clear()
    assert.equal(builder.makeUrl(), 'http://foo.com/')
  })

  test('get params as an object', ({ assert }) => {
    const builder = new UrlBuilder('http://foo.com')
    builder.param('foo', 'bar')
    builder.param('bar', 'baz')
    assert.deepEqual(builder.getParams(), { foo: 'bar', bar: 'baz' })
  })
})
