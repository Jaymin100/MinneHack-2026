# HeartSync

App made for MinneHack 2026

HeartSync is an app made for students to help them maintain and repiar relationships over periods of time where they might be really busy with school. Right now its easier than ever to forget that your not alone. With this app you will be able to not only help manage your relationships but also log your mood. We keep track of your top contacts and how often you interact with them.

Features

- Mood logging
- Managing Relationships
- Mood/outreach dashboard

To do

- add sms/push notficaitons to notify you to reach out to friends after a period of time
- a nudge/poke feauture that would have the users send a message to their friend via twilio
- Enhanced AI analysis of relationships with more data gathered from our contacts such as events we did with them or events we did in person together.

## Running the App

Route to /HeartSync and from there run:

- `npm install`
- `npm run dev` to run locally

Uses Firebase for auth and Firestore. Add your Vercel domain in Firebase Console under Authentication → Authorized domains if you're deploying. 

open AI key required, use OPENAI_API_KEY inside your .env

