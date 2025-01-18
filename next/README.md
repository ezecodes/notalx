## Installation

1. Install the necessary dependencies by running:

   ```bash
   npm install
   ```

2. Create a .env file in the root directory of the project.

3. Add the following environment variables to your .env file:

- `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`
- `NEXT_PUBLIC_S3_BASE_URL=/var/www/images/`
- `NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY=<your-recaptcha-site-key>`
- `NEXT_PUBLIC_API_BASE_URL`: This is the base URL of your API server. For local development, the server must be started on the same machine. You can also use http://api.clifbay.com for quick testing and development. <br /><br />
  `NEXT_PUBLIC_S3_BASE_URL`: This is the URL for accessing assets. The assets domain has been moved to assets.clifbay.com. <br />
  `NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY`: Provide your Google reCAPTCHA site key here.

## Running the Project

After completing the setup, you can run the Next.js development server: <br />
`npm run dev`

The project will be accessible at http://localhost:3000 by default.

## Quick Testing & Development

-For quick testing or development, you can use the API server at https://api.clifbay.com instead of running it locally. <br />
Simply set `NEXT_PUBLIC_API_BASE_URL` to: `https://api.clifbay.com `

## Generating the Sitemap

There is a script available to generate the sitemap for the entire site:
`npm run sitemap` <br />
This will execute the script located at `_scripts/generate_sitemap.js` and generate the sitemap.

#### Important Note

- Do not commit the generated sitemap file to Git. You can add the generated sitemap to your .gitignore file to prevent accidental commits.
