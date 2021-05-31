<div align="center"><img src="https://res.cloudinary.com/adonisjs/image/upload/q_100/v1557762307/poppinss_iftxlt.jpg" width="600px"></div>

# Oauth Client
> A framework agnostic package to implement "Login with" flow using OAuth compliant authorization servers.

[![gh-workflow-image]][gh-workflow-url] [![npm-image]][npm-url] [![license-image]][license-url] [![typescript-image]][typescript-url] [![synk-image]][synk-url]

This package ships with the implementation of `OAuth1.0 - three-legged flow` and `OAuth2.0 - Authorization Code Grant` flows. You can use it to build "Login with" flow in your Node.js applications.

- The package is framework agnostic.
- Ships with generic implementations that can be used to login with any identity provider.
- Simple to use and intuitive APIs.
- Intellisense all the way - The code is written in Typescript

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table of contents

- [Motivation](#motivation)
- [Who should use this package?](#who-should-use-this-package)
- [Installation](#installation)
    - [👉 Real examples](#-real-examples)
- [OAuth2 direct usage](#oauth2-direct-usage)
    - [Step 1. Instantiate the `Oauth2Client`](#step-1-instantiate-the-oauth2client)
    - [Step 2. Generate the redirect URL](#step-2-generate-the-redirect-url)
    - [Step 3. Redirect user to the URL](#step-3-redirect-user-to-the-url)
    - [Step 4. Handle post-authorization callback](#step-4-handle-post-authorization-callback)
- [OAuth1 direct usage](#oauth1-direct-usage)
    - [Step 1. Instantiate the `Oauth1Client`](#step-1-instantiate-the-oauth1client)
    - [Step 2. Generate the request token](#step-2-generate-the-request-token)
    - [Step 3. Redirect user to the URL](#step-3-redirect-user-to-the-url-1)
    - [Step 4. Handle post-authorization callback](#step-4-handle-post-authorization-callback-1)
- [Creating a custom Oauth2.0 driver](#creating-a-custom-oauth20-driver)
- [Creating a custom Oauth1.0 driver](#creating-a-custom-oauth10-driver)
- [Clearing existing params or fields](#clearing-existing-params-or-fields)
  - [Following is the list of fields/params set by the clients implicitly](#following-is-the-list-of-fieldsparams-set-by-the-clients-implicitly)
- [Difference with Oauth1Param and param](#difference-with-oauth1param-and-param)
- [FAQs](#faqs)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Motivation
The motivation for this package is to have a framework-agnostic implementation for the protocols themselves. The passportjs ecosystem relies heavily on the Express framework.

I intentionally decided to only cover **OAuth1.0 - three-legged flow** and **OAuth2.0 - Authorization Code Grant**. It keeps the surface area for the code smaller, and these are the two most popular flows for server-side implementations.

There is another protocol-specific package [oauth](https://www.npmjs.com/package/oauth) that I have personally used for years but had the following issues with it.

- First, it's not maintained anymore. Maybe that's okay because there is not much to update for packages that implement slowly changing protocols.
- The package is mainly driven by config, and adding params/form fields to the underlying requests is heavily dependent upon the exposed configuration values. Whereas the `@poppinss/oauth-client` implementation gives you access to the underlying requests, and you have complete freedom to modify the request params.
- Lastly, extending the classes of the `oauth` package was a pain. Maybe it was not written to be extended the way I wanted. 

## Who should use this package?

The ideal target user for this module is the package creators - someone who wants a low-level framework-agnostic implementation of the Protocols and builds the specialized drivers themselves.

With that said, you can also use this package inside your application code directly. The API is small and offers to tweak almost every request parameter.

## Installation

Install the package from the npm registry as follows:

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

For any other query params, you can pass a callback and modify the request object manually. In the following example, we define the Github specific `allow_signup` param.

```ts
const url = client.getRedirectUrl((request) => {
  /**
   * A github specific query string
   */
  request.param('allow_signup', true)
})
```

#### Step 3. Redirect user to the URL
Based upon your underlying web framework, you must redirect the user to the URL generated in **Step 2**.

#### Step 4. Handle post-authorization callback
After the user authorizes or denies the login request, the authorization server will redirect them back to your registered callback URL.

Upon redirect, you will get the authorization `code` or the error based on the user action. **You must read the provider docs and handle the errors correctly before generating an access token**.

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

The generated access token has the following parameters.

- token (string): The access token value. You must store it securely
- type (string): The token type
- refreshToken (string): **Optional** and available when the provider supports it.
- expiresIn (number): **Optional** and available when the provider supports it.
- expiresAt (luxon.DateTime): **Optional** and exists when `expiresIn` exists.

All other response values are merged into the `accessToken` object, and you can access them directly. For example:

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
OAuth1.0 is a three-legged process and requires you to generate a request token and secret before redirecting the user.

```ts
const { token, secret } = await client.getRequestToken()
```

The `getRequestToken` method usually doesn't need any extra params. However, do check the provider docs and use the callback to configure the API request.

```ts
await client.getRequestToken((request) => {
  request.param('key', 'value')
})
```

#### Step 3. Redirect user to the URL
The next step is to redirect the user to authorize the request. However, with OAuth1.0, you will have to store the `token` and `secret` generated in **Step 2** inside cookies. Later, you will need it for validation.

```ts
const url = client.getRedirectUrl((request) => {
  /**
   * Set the "oauth_token" generated in Step 2
   */
  request.param('oauth_token', token)
})
```

#### Step 4. Handle post-authorization callback
After the user authorizes or denies the login request, the authorization server will redirect them back to your registered callback URL.

Upon redirect, you will get the `oauth_token` and the `oauth_verifier` inside the query string. If both or one is missing, then you must abort the request.

Next, you must retrieve the `token` and `secret` you saved inside the cookies in **Step 3**. Finally, we will end up with the following four values.

- `token`: The token value from the cookie (Need it to generate access token)
- `secret`: The token secret the cookie (Need it to generate access token)
- `oauth_token`: Passed as query string by the authorization server
- `oauth_verifier`: Passed as query string by the authorization server

Verify the `token` and the `oauth_token` to be the same as follows.

```ts
client.verifyState(token, oauth_token)
```

Finally, you are ready to generate the access token. Do make sure also to set the `oauth_verifier`.

```ts
const accessToken = await client.getAccessToken({
  token: token,
  secre: secret,
}, (request) => {
  request.oauth1Param('oauth_verifier', oauth_verifier)
})
```

The generated access token has the following parameters.

- token (string): The access token value. You must store it securely
- secret (string): The access token secret. You must store it securely

All other response values are merged into the accessToken object, and you can access them directly. For example:

```ts
accessToken.scopes
accessToken.idToken
```

## Creating a custom Oauth2.0 driver
You must create custom drivers for a specific framework. Doing so will help you abstract all the cookie-based state management and input verifications away from the end-user.

Following is the bare minimum setup for a custom driver. Using the lifecycle hooks, you can configure some aspects of the client.

- The `configureRedirectRequest` allows you to configure the redirect request.
- The `configureAccessTokenRequest` hook allows you to configure the API request for an access token.
- The `processClientResponse` hook let you process the `accessToken` response. Here you are given the authorization server's raw response, and you must convert it to an object with at least the following fields.
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
   * Self-process the client response.
   */
  protected processClientResponse(client: HttpClient, response: any): any {
    /**
     * Return JSON as it is when parsed response as JSON
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

Similarly, you may override the `getAccessToken` method and perform the state validation before generating the access token.

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
You must create custom drivers for a specific framework. Doing so will help you abstract all the cookie-based state management and input verifications away from the end-user.

Following is the bare minimum setup for a custom driver. Using the lifecycle hooks, you can configure some aspects of the client.

- The `configureRequestTokenRequest` allows you to configure the API request for generating 
- The `configureRedirectRequest` allows you to configure the redirect request.
- The `configureAccessTokenRequest` hook allows you to configure the API request for the access token.
- The `processClientResponse` hook let you process the `accessToken` response. Here you are given the authorization server's raw response, and you must convert it to an object with at least the following fields.
  - oauth_token (string)
  - oauth_token_secret (string)

  The hook is called for both the `requestToken` and the `accessToken` API calls.

```ts
import { Oauth1Client, Oauth1ClientConfig, HttpClient } from '@poppinss/oauth-client'

export class TwitterDriver extends Oauth1Client {
  constructor(config: Oauth1ClientConfig) {
    super(config)
  }

  /**
   * Self-process the client response.
   */
  protected processClientResponse(
    event: 'requestToken' | 'accessToken',
    client: HttpClient,
    response: any
  ): any {
    /**
     * Return JSON as it is when parsed response as JSON
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
    return super.getAccessToken({
      token: existingToken,
      secret: existingSecret
    }, callback)
  }

}
```

## Clearing existing params or fields
Both the `Oauth2Client` and `Oauth1Client` class defines the default params or form fields for different API requests. The defined values are usually applicable across Oauth providers. However, you can clear the defaults and define them manually yourself. For example:

The `Oauth2Client` defines the following form fields when generating the access token.

```ts
request.field('grant_type', 'authorization_code')
request.field('redirect_uri', this.options.callbackUrl)
request.field('client_id', this.options.clientId)
request.field('client_secret', this.options.clientSecret)
```

You can remove one or all fields as follows.

```ts
client.getAccessToken((request) => {
  // Clear everthing
  request.clear()

  // Clear a given field
  request.clearField('redirect_uri')
  request.field('callback_url', client.options.callbackUrl)
})
```

The process remains the same for other values as well.

- `request.clearParam` clears the query string param
- `request.clearOauth1Param` clears the Oauth1 param
- `request.clearHeader` clears the existing header
- `request.clearField` clears the form field


### Following is the list of fields/params set by the clients implicitly

<details>
  <summary> <code>Oauth2Client.getRedirectUrl</code> </summary>

The following query params are defined.

  - redirect_uri: Referenced from the config
  - client_id: Referenced from the config

  ```ts
  client.getRedirectUrl((request) => {
    request.clearParam('redirect_uri')
    request.clearParam('client_id')
  })
  ```

</details>


<details>
  <summary> <code>Oauth2Client.getAccessToken</code> </summary>

  The following form fields are defined.

  - grant_type: Hard coded to `'authorization_code'`
  - redirect_uri: Referenced from config
  - client_id: Referenced from config
  - client_secret: Referenced from config

  ```ts
  client.getAccessToken((request) => {
    request.clearField('grant_type')
    request.clearField('redirect_uri')
    request.clearField('client_id')
    request.clearField('client_secret')
  })
  ```

</details>

<details>
  <summary> <code>Oauth1Client.getRequestToken</code> </summary>

  The following oauth1Params are defined.

  - oauth_callback: Referenced from config

  ```ts
  client.getRequestToken((request) => {
    request.clearOauth1Param('oauth_callback')
  })
  ```

</details>

## Difference with Oauth1Param and param
The Oauth1 specification has two types of parameters. One is added to the URL as a query string, and the other one is added to the `Authorization` header, sometimes called the **base string**.

- You can use the `request.param` method to define the query string param.
- And the `request.oauth1Param` method to define the Authorization header param.

## FAQs

<details>
  <summary>
    <strong> Why are you using <code>got</code> and <code>luxon</code> dependencies? </strong>
  </summary>

  I use these dependencies in my apps, so having them inside a package is fine for me. Also, I am not a big fan of micro optimizing the dependencies size. At last, the code is not bundled for the browsers.

  So having a better and stable API is more important than saving the 4 kilobytes.
</details>

<details>
  <summary>
    <strong> What's wrong with Passportjs? </strong>
  </summary>

  Nothing. It relies on ExpressJS. This package is framework agnostic and ships with the protocol implementation
</details>

<details>
  <summary>
    <strong> How about adding other Oauth2.0 flows? </strong>
  </summary>

  Not right now 😬. The server-side implementations mainly use the <code>Authorization Code Grant </code> flow, and I want to keep this package focused on that only.
</details>

[gh-workflow-image]: https://img.shields.io/github/workflow/status/poppinss/oauth-client/test?style=for-the-badge
[gh-workflow-url]: https://github.com/poppinss/oauth-client/actions/workflows/test.yml "Github action"

[npm-image]: https://img.shields.io/npm/v/@poppinss/oauth-client.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/@poppinss/oauth-client "npm"

[license-image]: https://img.shields.io/npm/l/@poppinss/oauth-client.svg?color=blueviolet&style=for-the-badge
[license-url]: LICENSE.md "license"

[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]:  "typescript"

[synk-image]: https://img.shields.io/snyk/vulnerabilities/github/poppinss/oauth-client?label=Synk%20Vulnerabilities&style=for-the-badge
[synk-url]: https://snyk.io/test/github/poppinss/oauth-client?targetFile=package.json "synk"
