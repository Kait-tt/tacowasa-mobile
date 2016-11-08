# tacowasa-mobile
Web based user interface for mobile of tacowasa

[![Build Status](https://travis-ci.org/Kait-tt/tacowasa-mobile.svg?branch=master)](https://travis-ci.org/Kait-tt/tacowasa-mobile)

# requirements
- node v6
- npm

# install

## development
```
git clone https://github.com/Kait-tt/tacowasa-mobile
cd tacowasa-mobile
npm install
npm run build
npm link
cd ..

git clone https://github.com/Kait-tt/tacowasa
cd tacowasa
# see https://github.com/Kait-tt/tacowasa#development
npm link tacowasa-mobile

npm start
# open http://localhost:3000 in browser
```

# scripts
see `package.json`

- `npm run build` : build public files with webpack
- `npm run watch` : watch to build
- `npm run lint:all` : run eslint for all js files
