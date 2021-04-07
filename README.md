# @poppinss/oauth-client
> A package to implement "Login with" flow using OAuth compliant authorization servers.

[![circleci-image]][circleci-url] [![npm-image]][npm-url] [![license-image]][license-url] [![typescript-image]][typescript-url] [![synk-image]][synk-url]

This package ships with the implementation of `OAuth1.0 - three-legged flow` and `OAuth2.0 - Authorization Code Grant` flows. You can use it to build "Login with" flow in your Node.js applications.

- The package is framework agnostic.
- Ships with generic implementations, that can be used to login with any identity provider.
- Simple to use and intuitive APIs.
- Intellisense all the way - The code is written in Typescript

## Who should use this package?

The ideal target user for this module is the package creators. Someone who wants a low level framework agnostic implementation of the Protocols and build the specialized drivers themselves.

With that said, you can also use this package inside your application code directly. The API is small and offers tweaking almost every request parameter.

## Installation

Install the package from npm registry as follows:

```sh
npm i @poppinss/oauth-client

## Yarn users
yarn add @poppinss/oauth-client
```

#### 👉 [Real examples](./examples)
Make sure to create the `.env` file and define all the following variables for the examples to work.

```env
PORT=3000

# Twitter credentials
TWITTER_API_KEY=
TWITTER_APP_SECRET=

# Github credentials
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Google credentials
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Gitlab credentials
GITLAB_CLIENT_ID=
GITLAB_CLIENT_SECRET=
```

## OAuth2 direct usage

This section covers the usage of the generic drivers directly within your application code. Checkout [creating custom drivers](#creating-a-custom-oauth20-driver) section to create a custom OAuth2.0 driver.


#### Step 1. Instantiate the `Oauth2Client`

```ts
import { Oauth2Client } from '@poppinss/utils'

const client = new Oauth2Client({
  /**
   * The callback registered with Github
   */
  callbackUrl: 'http://localhost/github/callback',

  /**
   * The github client id. Keep it inside env variables
   */
  clientId: process.env.GITHUB_CLIENT_ID!,

  /**
   * The github client secret. Keep it inside env variables
   */
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,

  /**
   * The URL to redirect to for user authorization
   */
  authorizeUrl: 'https://github.com/login/oauth/authorize',

  /**
   * The URL to fetch the access token
   */
  accessTokenUrl: 'https://github.com/login/oauth/access_token',
})
```

#### Step 2. Generate the redirect URL
The `getRedirectUrl` defines the `redirect_uri` and the `client_id` query params by reading them from your supplied config.

For any other query params, you can pass a callback and modify the request object. Manually. In the following example, we define the Github specific `allow_signup` param.

```ts
const url = client.getRedirectUrl((request) => {
  /**
   * A github specific query string
   */
  request.param('allow_signup', true)
})
```

#### Step 3. Redirect user to the URL
Based upon the underlying web framework you are using, you must redirect the user to the URL generated in Step 2.

#### Step 4. Handle post authorization callback
After the user authorizes or denies the login request, the authorization server will redirect them back to your registered callback URL.

Upon redirect, you will get the authorization `code` or the error based upon the user action. You must read the provider docs and handle the errors properly, before attempting to generate an access token.

The `getAccessToken` method sets the following form fields for the access token POST request.

- grant_type: Hard coded to 'authorization_code'
- redirect_uri: Referenced from config
- client_id: Referenced from config
- client_secret: Referenced from config

You must set the authorization code and any other form fields manually by defining the optional callback.

```ts
const accessToken = await client.getAccessToken((request) => {
  request.param('code', req.query.code)
})
```

The generated access token has following parameters

- token (string): The access token value. You must store is securly
- type (string): The token type
- refreshToken (string): **Optional** and available when the provider supports it.
- expiresIn (number): **Optional** and available when the provider supports it.
- expiresAt (luxon.DateTime): **Optional** and exists when `expiresIn` exists.

All other response values are merged into the accessToken object and you can access them directly. For example:

```ts
accessToken.scopes
accessToken.idToken
```

## OAuth1 direct usage
This section covers the usage of the generic drivers directly within your application code. Checkout [creating custom drivers](#creating-a-custom-oauth10-driver) section to create a custom OAuth1.0 driver.

#### Step 1. Instantiate the `Oauth1Client`

```ts
import { Oauth1Client } from '@poppinss/utils'

const client = new Oauth1Client({
  /**
   * The callback registered with Twitter
   */
  callbackUrl: 'http://localhost/twitter/callback',

  /**
   * The twitter consumer key. Keep it inside env variables
   */
  clientId: process.env.GITHUB_CLIENT_ID!,

  /**
   * The twitter consumer secret. Keep it inside env variables
   */
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,

  /**
   * The URL to generate the initial request token and secret.
   */
  requestTokenUrl: 'https://api.twitter.com/oauth/request_token',

  /**
   * The URL to redirect to for user authorization
   */
  authorizeUrl: 'https://api.twitter.com/oauth/authenticate',

  /**
   * The URL to fetch the access token
   */
  accessTokenUrl: 'https://api.twitter.com/oauth/access_token',
})
```

#### Step 2. Generate the request token
OAuth1.0 is a 3 legged process and requires you to first generate a request token and secret, before you can redirect the user.

```ts
const { token, secret } = await client.getRequestToken()
```

THe `getRequestToken` method usually doesn't any extra params. However, do check the provider docs and use the callback to configure the api request.

```ts
await client.getRequestToken((request) => {
  request.param('any_extra_param', '')
})
```

#### Step 3. Redirect user to the URL
The next step is to redirect the user to authorize the request. However, with OAuth1.0, you will have to store the `token` and `secret` generated in **Step 2** inside cookies. Later, you will need it for validation.

#### Step 4. Handle post authorization callback
After the user authorizes or denies the login request, the authorization server will redirect them back to your registered callback URL.

Upon redirect, you will get the `oauth_token` and the `oauth_verifier` inside the query string. If both or one is missing, then you must abort the request.

Next, you must retreive the `token` and `secret` you saved inside the cookies in **Step 3**. Finally, we will end up with following four values.

- `token`: The token value from the cookie
- `secret`: The token secret the cookie.
- `oauth_token`: Passed as query string by the authorization server
- `oauth_verifier`: Passed as query string by the authorization server

Re-instantiate the client instance and this time also define the `oauthToken` and `oauthTokenSecret` config properties.

```ts
const client = new Oauth1Client({
  // ... standard config values
  oauthToken: oauth_token,
  oauthTokenSecret: secret,
})
```

Verify the `token` and the `oauth_token` to be the same as follows.

```ts
client.verifyState(token, oauth_token)
```

Finally, you are ready to generate the access token. Do make sure to also set the `oauth_verifier`.

```ts
const accessToken = await client.getAccessToken((request) => {
  request.oauth1Param('oauth_verifier', oauth_verifier)
})
```

The generated access token has following parameters

- token (string): The access token value. You must store is securly
- secret (string): The access token secret. You must store is securly

All other response values are merged into the accessToken object and you can access them directly. For example:

```ts
accessToken.scopes
accessToken.idToken
```

## Creating a custom Oauth2.0 driver
You must create custom drivers for a specific framework. Doing so, will help you abstract all the cookie based state management and input verifications away from the end user.

Following is the bare minimum setup for a custom driver. Using the lifecycle hooks you can configure some aspects of the client.

- The `configureRedirectRequest` allows you configure the redirect request.
- The `configureAccessTokenRequest` hook allows you configure the API request for access token.
- The `processClientResponse` hook let you process the `accessToken` response. Here you are given the raw response from the authorization server and you must convert it to an object with atleast following fields.
  - access_token (string)
  - token_type (string)
  - expires_in Optional (number)
  - refresh_token Optional (string)

```ts
import { Oauth2Client, Oauth2ClientConfig, HttpClient } from '@poppinss/oauth-client'

export class GithubDriver extends Oauth2Client {
  constructor(config: Oauth2ClientConfig) {
    super(config)
  }

  /**
   * Self process the client response.
   */
  protected processClientResponse(client: HttpClient, response: any): any {
    /**
     * Return json as it is when parsed response as json
     */
    if (client.responseType === 'json') {
      return response
    }

    return parse(client.responseType === 'buffer' ? response.toString() : response)
  }

  /**
   * OPTIONAL
   *
   * Configure the redirect request. Invoked before
   * the user callback
   */
  protected configureRedirectRequest(request) {
    request.param('scope', 'repo gist user')
  }

  /**
   * OPTIONAL
   *
   * Configure the access token request. Invoked before
   * the user callback
   */
  protected configureAccessTokenRequest(request) {
    request.param('state', this.ctx.request.cookie('gh_oauth_state'))
  }
}
```

Next, you must implement/overwrite some of the methods to tighten the login experience. For example: Add the `redirect` method, which also defines the `state` CSRF cookie.

```ts
export class GithubDriver extends Oauth2Client {
  public redirect() {
    const state = this.getState()
    myFramework.res.cookie('state', state)

    const url = this.getRedirectUrl((request) => {
      request.param('state', state)
    })

    myFramework.res.redirect(url)
  }
}
```

Similarly, you can override the `getAccessToken` method and perform the state validation before generating the access token.

```ts
export class GithubDriver extends Oauth2Client {
  public async getAccessToken(callback?: (request: ApiRequestContract) => void): Promise<Token> {
    const existingState = myFramework.req.cookies.state
    const inputState = myFramework.req.query.inputState

    this.verifyState(existingState, inputState)
    return super.getAccessToken(callback)
  }
}
```

## Creating a custom Oauth1.0 driver
You must create custom drivers for a specific framework. Doing so, will help you abstract all the cookie based state management and input verifications away from the end user.

Following is the bare minimum setup for a custom driver. Using the lifecycle hooks you can configure some aspects of the client.

- The `configureRequestTokenRequest` allows you configure the API request for generating 
- The `configureRedirectRequest` allows you configure the redirect request.
- The `configureAccessTokenRequest` hook allows you configure the API request for access token.
- The `processClientResponse` hook let you process the `accessToken` response. Here you are given the raw response from the authorization server and you must convert it to an object with atleast following fields.
  - oauth_token (string)
  - oauth_token_secret (string)

  The hook is called for both the `requestToken` and the `accessToken` API calls

```ts
import { Oauth1Client, Oauth1ClientConfig, HttpClient } from '@poppinss/oauth-client'

export class TwitterDriver extends Oauth1Client {
  constructor(config: Oauth1ClientConfig) {
    super(config)
  }

  /**
   * Self process the client response.
   */
  protected processClientResponse(
    event: 'requestToken' | 'accessToken',
    client: HttpClient,
    response: any
  ): any {
    /**
     * Return json as it is when parsed response as json
     */
    if (client.responseType === 'json') {
      return response
    }

    return parse(client.responseType === 'buffer' ? response.toString() : response)
  }

  /**
   * OPTIONAL
   *
   * Configure the redirect request. Invoked before
   * the user callback
   */
  protected configureRedirectRequest(request) {}

  /**
   * OPTIONAL
   *
   * Configure the access token request. Invoked before
   * the user callback
   */
  protected configureAccessTokenRequest(request) {
  }
}
```

Next, you must implement/overwrite some of the methods to tighten the login experience. For example: Add the `redirect` method, which also defines the `state` CSRF cookie.

```ts
export class TwitterDriver extends Oauth1Client {
  public async redirect() {
    const { token, secret } = await this.getRequestToken()
    myFramework.res.cookie('token', token)
    myFramework.res.cookie('secret', secret)

    const url = this.getRedirectUrl((request) => {
      request.param('oauth_token', token)
    })

    myFramework.res.redirect(url)
  }
}
```

Similarly, you can override the `getAccessToken` method and perform the state validation before generating the access token.

```ts
export class TwitterDriver extends Oauth1Client {
  public async getAccessToken(callback?: (request: ApiRequestContract) => void): Promise<Token> {
    const existingToken = myFramework.req.cookies.token
    const oauthToken = myFramework.req.query.oauth_token
    const existingSecret = myFramework.req.cookies.secret
    const oauthVerifier = myFramework.req.query.oauth_verifier

    this.verifyState(existingToken, oauthToken)

    /**
     * Create a child instance, pass it the config with
     * two extra params this time and generate the
     * access token
     */
    return this
      .child({
        ...this.options,
        oauthToken: oauthToken,
        oauthTokenSecret: existingSecret
      })
      .getAccessToken(callback)
  }
}
```

[circleci-image]: https://img.shields.io/circleci/project/github/poppinss/oauth-client/master.svg?style=for-the-badge&logo=circleci
[circleci-url]: https://circleci.com/gh/poppinss/oauth-client "circleci"

[npm-image]: https://img.shields.io/npm/v/@poppinss/oauth-client.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/@poppinss/oauth-client "npm"

[license-image]: https://img.shields.io/npm/l/@poppinss/oauth-client?color=blueviolet&style=for-the-badge
[license-url]: LICENSE.md "license"

[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]:  "typescript"

[synk-image]: https://img.shields.io/snyk/vulnerabilities/github/poppinss/oauth-client?label=Synk%20Vulnerabilities&style=for-the-badge
[synk-url]: https://snyk.io/test/github/poppinss/oauth-client?targetFile=package.json "synk"
