# LiftGoMK CMS

The CMS is available at:

https://bojan-ivanovski.github.io/lift-go-mk/admin/

## Sign in

1. Open the CMS and choose **Sign In with Token**.
2. Follow the GitHub link shown by the CMS to create a fine-grained personal access token.
3. Give the token access only to `Bojan-Ivanovski/lift-go-mk` with **Contents: Read and write** permission.
4. Paste the token into the CMS. The token stays in the browser and must never be committed to the repository.

## Publishing

Edit the home page and select **Publish**. The CMS updates `src/content/site.json` on the `main` branch. The existing GitHub Actions workflow then rebuilds and deploys the website to GitHub Pages.

Images uploaded in the CMS are stored in `public/uploads`.

## Videos

Under **Видеа**, add an item, upload an MP4 or WebM file, enter its title, and optionally upload a thumbnail image and description. Keep each video below GitHub's 100 MB per-file limit. If no thumbnail is supplied, the website uses the video itself as the card preview.
