# Frontend app for [Visual Regression Tracker](https://github.com/Visual-Regression-Tracker/Visual-Regression-Tracker)

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/6e0ad7c1492440cbb95181003c8dccc4)](https://www.codacy.com/gh/Visual-Regression-Tracker/frontend?utm_source=github.com&utm_medium=referral&utm_content=Visual-Regression-Tracker/frontend&utm_campaign=Badge_Grade)

## Local setup

- clone repo
- `npm i`
- Update `.env`
- `npm run start`

## Image download
 
 - If you want to use image download feature in test runs, you have to have the files in backend imageUploads folder to a folder in this project under public/imageUploads. This can be achieved via manual copy, docker volume mapping to this project folder etc.

## Local HTTPS config

- Generate keys [here](https://www.selfsignedcertificate.com/)
- place in folder `/secrets` named `ssl.cert` and `ssl.key`
