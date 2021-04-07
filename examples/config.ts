import { Oauth1ClientConfig, Oauth2ClientConfig } from '../src/Contracts'
const BASE_URL = `http://localhost:${process.env.PORT}`

export const githubConfig: Oauth2ClientConfig = {
  callbackUrl: `${BASE_URL}/github/callback`,
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  authorizeUrl: 'https://github.com/login/oauth/authorize',
  accessTokenUrl: 'https://github.com/login/oauth/access_token',
}

export const twitterConfig: Oauth1ClientConfig = {
  callbackUrl: `${BASE_URL}/twitter/callback`,
  clientId: process.env.TWITTER_API_KEY!,
  clientSecret: process.env.TWITTER_APP_SECRET!,
  requestTokenUrl: 'https://api.twitter.com/oauth/request_token',
  authorizeUrl: 'https://api.twitter.com/oauth/authenticate',
  accessTokenUrl: 'https://api.twitter.com/oauth/access_token',
}

export const googleConfig: Oauth2ClientConfig = {
  callbackUrl: `${BASE_URL}/google/callback`,
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  accessTokenUrl: 'https://oauth2.googleapis.com/token',
}

export const gitlabConfig: Oauth2ClientConfig = {
  callbackUrl: `${BASE_URL}/gitlab/callback`,
  clientId: process.env.GITLAB_CLIENT_ID!,
  clientSecret: process.env.GITLAB_CLIENT_SECRET!,
  authorizeUrl: 'https://gitlab.com/oauth/authorize',
  accessTokenUrl: 'https://gitlab.com/oauth/token',
}
